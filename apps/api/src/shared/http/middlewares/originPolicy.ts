import cors from 'cors';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import AppError from '@shared/errors/AppError';

function hostOf(origin: string): string | undefined {
  try {
    return new URL(origin).host;
  } catch {
    return undefined;
  }
}

/**
 * Sozinho, o pacote cors só omite cabeçalhos: a requisição de uma origem
 * proibida ainda seria executada. Aqui ela é recusada com 403. A origem igual
 * ao host da requisição (front e API no mesmo domínio) dispensa configuração;
 * sem cabeçalho Origin não é navegador em outro site (curl, monitoramento).
 */
export function originPolicy(allowedOrigins: string[]): RequestHandler {
  const allowAll = allowedOrigins.includes('*');
  const corsHeaders = cors({ origin: allowAll ? '*' : allowedOrigins });

  return (request: Request, response: Response, next: NextFunction): void => {
    const origin = request.get('origin');
    const allowed =
      !origin ||
      allowAll ||
      allowedOrigins.includes(origin) ||
      hostOf(origin) === request.host;

    if (!allowed) {
      next(new AppError('Origin not allowed', 403));
      return;
    }
    corsHeaders(request, response, next);
  };
}
