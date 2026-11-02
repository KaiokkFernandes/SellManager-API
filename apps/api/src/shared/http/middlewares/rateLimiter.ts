import { Request } from 'express';
import { ipKeyGenerator, rateLimit, Store } from 'express-rate-limit';
import { env } from '@config/env';

interface RateLimiterOptions {
  /** Contagem compartilhada entre instâncias (Redis). Padrão: em memória. */
  store?: Store;
  limit?: number;
  skip?: boolean;
}

/** Limite para rotas sensíveis a força bruta (login, cadastro, senha). */
export function createAuthRateLimiter({
  store,
  limit = 20,
  skip = env.NODE_ENV === 'test',
}: RateLimiterOptions = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => skip,
    ...(store && { store }),
    // Redis fora do ar não pode impedir o login de todo mundo: libera a
    // requisição e registra o erro
    passOnStoreError: true,
    // um contador por IP e rota: errar a senha não bloqueia "esqueci a senha"
    keyGenerator: (request: Request) => {
      const { path } = request.route as { path: string };
      return `${ipKeyGenerator(request.ip ?? '')}:${path}`;
    },
    message: {
      status: 'error',
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  });
}
