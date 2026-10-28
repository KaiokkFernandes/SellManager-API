import { NextFunction, Request, Response } from 'express';
import type { IUsersRepository } from '@modules/users/domain/repositories/IUsersRepository';
import AppError from '@shared/errors/AppError';
import { ITokenProvider } from '@shared/providers/TokenProvider/ITokenProvider';

/**
 * Valida o JWT e carrega o usuário do banco a cada requisição: papel alterado
 * ou conta desativada valem na hora, e tokens emitidos antes da última troca
 * de senha são recusados.
 */
export function ensureAuthenticated(
  tokenProvider: ITokenProvider,
  usersRepository: Pick<IUsersRepository, 'findById'>,
) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return next(new AppError('JWT token is missing', 401));
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(new AppError('Invalid JWT token', 401));
    }

    tokenProvider
      .verify(token)
      .catch(() => {
        throw new AppError('Invalid JWT token', 401);
      })
      .then(async ({ subject, issuedAt }) => {
        const user = await usersRepository.findById(subject);
        if (!user?.active) {
          throw new AppError('Invalid JWT token', 401);
        }
        const changedAt = user.password_changed_at;
        if (changedAt && issuedAt < Math.floor(changedAt.getTime() / 1000)) {
          throw new AppError('Session expired after password change', 401);
        }
        request.user = { id: user.id, role: user.role };
        next();
      })
      .catch(next);
  };
}
