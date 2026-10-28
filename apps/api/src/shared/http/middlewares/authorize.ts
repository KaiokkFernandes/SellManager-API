import { NextFunction, Request, Response } from 'express';
import { can, type Permission } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';

/**
 * Exige a permissão do mapa de @sellmanager/shared para o papel do usuário
 * (carregado pelo ensureAuthenticated). Montado pelo contrato em toda rota que
 * declara `permission`: nunca registrado à mão.
 */
export function authorize(permission: Permission) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (can(request.user.role, permission)) return next();
    next(
      new AppError('You do not have permission to perform this action', 403, {
        code: 'FORBIDDEN',
        details: { permission },
      }),
    );
  };
}
