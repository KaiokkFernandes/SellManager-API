import type { ApiErrorCode, ValidationIssue } from '@sellmanager/shared';

const DEFAULT_CODES: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
};

interface AppErrorOptions {
  /** Código estável do contrato; o padrão é deduzido do status. */
  code?: ApiErrorCode;
  issues?: ValidationIssue[];
  details?: unknown;
}

class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly issues?: ValidationIssue[];
  public readonly details?: unknown;

  // status code padrão é 400
  constructor(
    message: string,
    statusCode = 400,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = options.code ?? DEFAULT_CODES[statusCode] ?? 'BAD_REQUEST';
    this.issues = options.issues;
    this.details = options.details;
  }

  /** 409 ALREADY_EXISTS apontando o campo único em conflito (ex.: e-mail). */
  static alreadyExists(field: string, message: string): AppError {
    return new AppError(message, 409, {
      code: 'ALREADY_EXISTS',
      issues: [{ segment: 'body', path: field, message }],
    });
  }
}

export default AppError;
