import { NextFunction, Request, Response } from 'express';
import AppError from '@shared/errors/AppError';
import { logger } from '@shared/logger';

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

export function errorHandler(
  error: HttpError,
  request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    });
    return;
  }

  // Erros do body-parser (JSON malformado, payload grande demais etc.)
  if (
    error.type === 'entity.parse.failed' ||
    error.type === 'entity.too.large'
  ) {
    response
      .status(error.status ?? 400)
      .json({ status: 'error', message: error.message });
    return;
  }

  (request.log ?? logger).error({ err: error }, 'Unhandled error');
  response
    .status(500)
    .json({ status: 'error', message: 'Internal server error' });
}
