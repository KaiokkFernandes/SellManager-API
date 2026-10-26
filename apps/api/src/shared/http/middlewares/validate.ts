import { NextFunction, Request, Response } from 'express';
import type { RouteRequest } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';

type Segment = 'params' | 'query' | 'body';

const segments: Segment[] = ['params', 'query', 'body'];

/**
 * Valida body/params/query com os schemas do contrato e substitui os valores
 * pelos dados já convertidos (trim, coerção etc.). Em caso de erro responde
 * 400 com os issues. Corpo multipart (upload) não é validado aqui.
 */
export function validate(request: RouteRequest = {}) {
  return (req: Request, _response: Response, next: NextFunction): void => {
    const issues: { segment: Segment; path: string; message: string }[] = [];

    for (const segment of segments) {
      const schema = request[segment];
      if (!schema) continue;
      if (segment === 'body' && request.bodyType === 'multipart') continue;

      const result = schema.safeParse(req[segment]);

      if (!result.success) {
        issues.push(
          ...result.error.issues.map(issue => ({
            segment,
            path: issue.path.join('.'),
            message: issue.message,
          })),
        );
        continue;
      }

      // req.query é um getter no Express 5, por isso defineProperty.
      Object.defineProperty(req, segment, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (issues.length > 0) {
      return next(
        new AppError('Validation failed', 400, {
          code: 'VALIDATION_FAILED',
          issues,
        }),
      );
    }

    next();
  };
}
