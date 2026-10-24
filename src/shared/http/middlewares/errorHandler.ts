import { NextFunction, Request, Response } from 'express';
import AppError from '@shared/errors/AppError';

export function errorHandler(
  error: Error,
  _request: Request,
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

  console.error('Erro não tratado:', error);
  response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
