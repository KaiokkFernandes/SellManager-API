import { QueryFailedError } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { requestSerializers, serializeError } from './logger';

describe('logger', () => {
  it('erro de consulta não leva parâmetros nem o detalhe do banco', () => {
    const driverError = Object.assign(new Error('duplicate key'), {
      code: '23505',
      detail: 'Key (email)=(ana@cliente.com) already exists.',
    });
    const error = new QueryFailedError(
      'INSERT INTO users VALUES ($1, $2)',
      ['ana@cliente.com', '$2a$10$hash-da-senha'],
      driverError,
    );

    const logged = JSON.stringify(serializeError(error));

    expect(logged).toContain('duplicate key');
    expect(logged).toContain('QueryFailedError');
    expect(logged).not.toContain('ana@cliente.com');
    expect(logged).not.toContain('hash-da-senha');
  });

  it('requisição registra só método e caminho', () => {
    const logged = requestSerializers.req({
      id: 7,
      method: 'GET',
      url: '/customers?search=ana@cliente.com',
      headers: {
        authorization: 'Bearer abc',
        cookie: 'a=b',
        'x-vercel-oidc-token': 'token-interno',
        'x-forwarded-for': '203.0.113.9',
      },
      socket: { remoteAddress: '203.0.113.9' },
    } as never);

    expect(logged).toEqual({ id: 7, method: 'GET', path: '/customers' });
  });
});
