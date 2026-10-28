import { DataSource } from 'typeorm';
import { IUsersRepository } from '../../domain/repositories/IUsersRepository';
import { IUsersUnitOfWork } from '../../domain/repositories/IUsersUnitOfWork';
import { UsersRepository } from './repositories/UsersRepository';

export class UsersUnitOfWork implements IUsersUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  public run<T>(work: (users: IUsersRepository) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(manager =>
      work(new UsersRepository(manager)),
    );
  }
}
