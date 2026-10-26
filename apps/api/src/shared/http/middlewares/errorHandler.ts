import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { QueryFailedError } from 'typeorm';
import { apiErrorSchema, type ApiError } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';
import { logger } from '@shared/logger';
import {
  checkResponse,
  ContractViolationError,
  responseValidationMode,
} from '../contract/responseValidation';

interface HttpError extends Error {
  status?: number;
  type?: string;
}

export function notFoundHandler(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  next(new AppError(`Route ${request.method} ${request.path} not found`, 404));
}

function sendError(response: Response, status: number, body: ApiError): void {
  // o próprio erro também segue o contrato (validado fora de produção)
  checkResponse(
    apiErrorSchema,
    body,
    { operationId: 'error', status },
    responseValidationMode === 'off' ? 'off' : 'warn',
  );
  response.status(status).json(body);
}

/** Converte qualquer erro no formato padrão { status, code, message, issues?, details? }. */
export function errorHandler(
  error: HttpError,
  request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    sendError(response, error.statusCode, {
      status: 'error',
      code: error.code,
      message: error.message,
      ...(error.issues && { issues: error.issues }),
      ...(error.details !== undefined && { details: error.details }),
    });
    return;
  }

  if (error instanceof MulterError) {
    sendError(response, 400, {
      status: 'error',
      code: 'INVALID_UPLOAD',
      message: error.message,
      details: { reason: error.code },
    });
    return;
  }

  // 23503 foreign_key_violation / 23001 restrict_violation:
  // ex.: apagar cliente ou produto que tem pedidos
  if (
    error instanceof QueryFailedError &&
    ['23503', '23001'].includes(
      String((error.driverError as { code?: string }).code),
    )
  ) {
    sendError(response, 409, {
      status: 'error',
      code: 'RESOURCE_IN_USE',
      message: 'Resource is referenced by other records',
    });
    return;
  }

  // Erros do body-parser (JSON malformado, payload grande demais)
  if (error.type === 'entity.parse.failed') {
    sendError(response, 400, {
      status: 'error',
      code: 'BAD_REQUEST',
      message: error.message,
    });
    return;
  }
  if (error.type === 'entity.too.large') {
    sendError(response, 413, {
      status: 'error',
      code: 'PAYLOAD_TOO_LARGE',
      message: error.message,
    });
    return;
  }

  (request.log ?? logger).error({ err: error }, 'Unhandled error');
  sendError(response, 500, {
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    // em teste, a divergência de contrato aparece no corpo para facilitar o diagnóstico
    ...(error instanceof ContractViolationError &&
      responseValidationMode === 'strict' && {
        details: { contract_violation: error.message },
      }),
  });
}
