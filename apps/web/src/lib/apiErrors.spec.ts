import { ApiClientError } from '@sellmanager/api-client';
import { describe, expect, it } from 'vitest';
import { getErrorMessage, getFieldErrors } from './apiErrors';

const validation = new ApiClientError(400, {
  status: 'error',
  code: 'VALIDATION_FAILED',
  message: 'Validation failed',
  issues: [
    { segment: 'body', path: 'email', message: 'Invalid email address' },
    { segment: 'query', path: 'page', message: 'ignorado' },
  ],
});

describe('apiErrors', () => {
  it('traduz pelo code, não pelo texto da API', () => {
    expect(getErrorMessage(validation)).toBe('Confira os campos informados.');
    expect(getErrorMessage(new ApiClientError(0, undefined))).toMatch(
      /conectar ao servidor/,
    );
  });

  it('erro desconhecido recebe mensagem genérica', () => {
    expect(getErrorMessage(new Error('x'))).toMatch(/inesperado/);
  });

  it('extrai erros de campo do body', () => {
    expect(getFieldErrors(validation)).toEqual({
      email: 'Invalid email address',
    });
    expect(getFieldErrors(new Error('x'))).toEqual({});
  });
});
