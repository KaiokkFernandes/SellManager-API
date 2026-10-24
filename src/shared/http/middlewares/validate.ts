import { NextFunction, Request, Response } from 'express';
import { z, ZodType } from 'zod';
import AppError from '@shared/errors/AppError';

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

type Segment = keyof ValidationSchemas;

const segments: Segment[] = ['params', 'query', 'body'];

/**
 * Valida body/params/query com zod e substitui os valores pelos dados já
 * convertidos (trim, coerção etc.). Em caso de erro responde 400 com os issues.
 */
export function validate(schemas: ValidationSchemas) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const issues: { segment: Segment; path: string; message: string }[] = [];

    for (const segment of segments) {
      const schema = schemas[segment];
      if (!schema) continue;

      const result = schema.safeParse(request[segment]);

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
      Object.defineProperty(request, segment, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (issues.length > 0) {
      return next(new AppError('Validation failed', 400, issues));
    }

    next();
  };
}

export const idParamsSchema = z.object({
  id: z.uuid(),
});
