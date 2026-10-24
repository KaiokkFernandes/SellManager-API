import { describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';
import { z } from 'zod';
import AppError from '@shared/errors/AppError';
import { validate } from './validate';

function run(
  schemas: Parameters<typeof validate>[0],
  request: Partial<Request>,
) {
  const next = vi.fn();
  validate(schemas)(request as Request, {} as Response, next);
  return next;
}

describe('validate', () => {
  const body = z.object({ name: z.string().trim().min(1), age: z.number() });

  it('substitui o body pelos dados convertidos e chama next()', () => {
    const request: Partial<Request> = { body: { name: '  Ana  ', age: 30 } };

    const next = run({ body }, request);

    expect(next).toHaveBeenCalledWith();
    expect(request.body).toEqual({ name: 'Ana', age: 30 });
  });

  it('responde 400 com os issues de todos os segmentos', () => {
    const next = run(
      { body, params: z.object({ id: z.uuid() }) },
      { body: { name: '' }, params: { id: 'x' } },
    );

    const error = next.mock.calls[0]?.[0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ segment: 'params', path: 'id' }),
        expect.objectContaining({ segment: 'body', path: 'name' }),
        expect.objectContaining({ segment: 'body', path: 'age' }),
      ]),
    );
  });
});
