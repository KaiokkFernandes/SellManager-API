import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { IUsersUnitOfWork } from '../domain/repositories/IUsersUnitOfWork';

export class FakeUsersUnitOfWork implements IUsersUnitOfWork {
  constructor(private readonly users: IUsersRepository) {}

  public run<T>(work: (users: IUsersRepository) => Promise<T>): Promise<T> {
    return work(this.users);
  }
}
