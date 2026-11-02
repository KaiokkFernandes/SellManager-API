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

  it.each([
    [
      'objeto da Vercel',
      { error: { code: '500', message: 'FUNCTION_FAILED' } },
    ],
    ['code e message objeto', { code: 'X', message: { detail: 'y' } }],
    ['texto puro', 'A server error has occurred'],
    ['corpo vazio', undefined],
  ])('5xx com %s vira texto próprio, sempre string', (_name, body) => {
    const message = getErrorMessage(new ApiClientError(502, body));

    expect(message).toBe(
      'O servidor está indisponível no momento. Tente novamente em instantes.',
    );
  });

  it('code que este build não conhece não deixa a mensagem vazia', () => {
    const error = new ApiClientError(409, {
      status: 'error',
      code: 'NOVO_CODE',
      message: 'x',
    });

    expect(getErrorMessage(error)).toMatch(/inesperado/);
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
