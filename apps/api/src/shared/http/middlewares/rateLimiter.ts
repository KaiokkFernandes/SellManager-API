import { rateLimit } from 'express-rate-limit';
import { env } from '@config/env';

/** Limite para rotas sensíveis a força bruta (login, cadastro, senha). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
});
