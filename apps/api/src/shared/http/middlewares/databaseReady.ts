import { NextFunction, Request, Response } from 'express';
import AppError from '@shared/errors/AppError';
import type { IDatabaseConnection } from '@shared/infra/typeorm/connection';

/** Espera a conexão preguiçosa; se ela falhar, responde 503 e loga o motivo. */
export function databaseReady(database: IDatabaseConnection) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    database.ready().then(
      () => next(),
      (error: unknown) => {
        request.log.error({ err: error }, 'Banco de dados indisponível');
        next(
          new AppError('Service temporarily unavailable', 503, {
            code: 'SERVICE_UNAVAILABLE',
          }),
        );
      },
    );
  };
}
