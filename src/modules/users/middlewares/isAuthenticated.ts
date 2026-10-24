import { jwtVerify } from 'jose';
import { Request, Response, NextFunction } from 'express';
import auth from '@config/auth';
import AppError from '@shared/errors/AppError';

const secret = new TextEncoder().encode(auth.jwt.secret);

export default function isAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError('JWT token is missing', 401));
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Invalid JWT token', 401));
  }

  jwtVerify(token, secret)
    .then(({ payload }) => {
      if (!payload.sub) {
        throw new Error('Token without subject');
      }

      req.user = {
        id: payload.sub,
      };

      next();
    })
    .catch(() => next(new AppError('Invalid JWT token', 401)));
}
