import AppError from '@shared/errors/AppError';
import { assertAdminChangeAllowed } from '../domain/adminGuard';
import { User } from '../domain/entities/User';
import { IUsersUnitOfWork } from '../domain/repositories/IUsersUnitOfWork';

interface IRequest {
  actorId: string;
  id: string;
  active: boolean;
}

/**
 * Ativa ou desativa (usuários nunca são excluídos). O desativado perde as
 * sessões na hora: o middleware de autenticação confere `active` a cada requisição.
 */
export class UpdateUserStatusService {
  constructor(private readonly unitOfWork: IUsersUnitOfWork) {}

  public execute({ actorId, id, active }: IRequest): Promise<User> {
    return this.unitOfWork.run(async users => {
      const activeAdminIds = await users.lockActiveAdmins();
      const user = await users.findById(id);
      if (!user) throw new AppError('User not found', 404);

      assertAdminChangeAllowed({
        actorId,
        target: user,
        next: { role: user.role, active },
        activeAdminIds,
      });

      return users.save({ ...user, active });
    });
  }
}
