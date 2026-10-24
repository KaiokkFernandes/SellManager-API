import { NextFunction, Request, Response } from 'express';
import AppError from '@shared/errors/AppError';
import { ITokenProvider } from '@shared/providers/TokenProvider/ITokenProvider';

export function ensureAuthenticated(tokenProvider: ITokenProvider) {
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
      .then(({ subject }) => {
        request.user = { id: subject };
        next();
      })
      .catch(() => next(new AppError('Invalid JWT token', 401)));
  };
}
