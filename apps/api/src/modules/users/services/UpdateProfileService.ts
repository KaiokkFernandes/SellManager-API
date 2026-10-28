import AppError from '@shared/errors/AppError';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  user_id: string;
  name: string;
}

/** Perfil próprio: só o nome (e-mail é o login; papel só um ADMIN muda). */
export class UpdateProfileService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  public async execute({ user_id, name }: IRequest): Promise<User> {
    const user = await this.usersRepository.findById(user_id);
    if (!user) throw new AppError('User not found', 404);

    return this.usersRepository.save({ ...user, name });
  }
}
