import AppError from '@shared/errors/AppError';
import { assertAdminChangeAllowed } from '../domain/adminGuard';
import { Role, User } from '../domain/entities/User';
import { IUsersUnitOfWork } from '../domain/repositories/IUsersUnitOfWork';

interface IRequest {
  /** Quem está fazendo a alteração. */
  actorId: string;
  id: string;
  name: string;
  role: Role;
}

/** Edição por um ADMIN: nome e papel. */
export class UpdateUserService {
  constructor(private readonly unitOfWork: IUsersUnitOfWork) {}

  public execute({ actorId, id, name, role }: IRequest): Promise<User> {
    return this.unitOfWork.run(async users => {
      const activeAdminIds = await users.lockActiveAdmins();
      const user = await users.findById(id);
      if (!user) throw new AppError('User not found', 404);

      assertAdminChangeAllowed({
        actorId,
        target: user,
        next: { role, active: user.active },
        activeAdminIds,
      });

      return users.save({ ...user, name, role });
    });
  }
}
