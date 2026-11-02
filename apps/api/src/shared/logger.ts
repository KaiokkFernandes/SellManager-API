import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import { env } from '@config/env';

const defaultLevel = {
  development: 'debug',
  test: 'silent',
  production: 'info',
} as const;

/**
 * Só tipo, mensagem e pilha: o erro do TypeORM carrega os parâmetros da
 * consulta e o do driver os valores da linha (e-mail, hash de senha), que não
 * podem ir para o log.
 */
export function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) return error;
  const { code } = error as { code?: unknown };
  return {
    type: error.name,
    message: error.message,
    stack: error.stack,
    ...(typeof code === 'string' && { code }),
  };
}

/**
 * Lista permitida da requisição: método e caminho. Cabeçalhos ficam de fora
 * (na Vercel incluem tokens internos), assim como IP e query string, que traz
 * buscas por nome e e-mail de clientes.
 */
export const requestSerializers = {
  req: (request: IncomingMessage & { id?: unknown }) => ({
    id: request.id,
    method: request.method,
    path: request.url?.split('?')[0],
  }),
  res: (response: ServerResponse) => ({ statusCode: response.statusCode }),
};

export const logger = pino({
  level: env.LOG_LEVEL ?? defaultLevel[env.NODE_ENV],
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.old_password',
  ],
  serializers: { err: serializeError },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'SYS:HH:MM:ss' },
    },
  }),
});
