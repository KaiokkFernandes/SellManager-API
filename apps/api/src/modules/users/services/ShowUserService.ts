import AppError from '@shared/errors/AppError';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

export class ShowUserService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  public async execute({ id }: { id: string }): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}
