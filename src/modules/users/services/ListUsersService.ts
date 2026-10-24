import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

export class ListUsersService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  public execute(): Promise<User[]> {
    return this.usersRepository.findAll();
  }
}
