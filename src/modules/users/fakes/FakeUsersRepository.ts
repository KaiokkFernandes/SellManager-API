import { randomUUID } from 'node:crypto';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { User } from '../domain/entities/User';
import {
  ICreateUserDTO,
  IUsersRepository,
} from '../domain/repositories/IUsersRepository';

export class FakeUsersRepository implements IUsersRepository {
  public readonly users: User[] = [];

  public findAll(pagination: PaginationParams): Promise<PageResult<User>> {
    return Promise.resolve(slicePage([...this.users], pagination));
  }

  public findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find(user => user.id === id) ?? null);
  }

  public findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find(user => user.email === email) ?? null,
    );
  }

  public create(data: ICreateUserDTO): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      avatar: null,
      created_at: now,
      updated_at: now,
      ...data,
    };
    this.users.push(user);
    return Promise.resolve({ ...user });
  }

  public save(user: User): Promise<User> {
    const index = this.users.findIndex(item => item.id === user.id);
    const saved = { ...user, updated_at: new Date() };
    if (index >= 0) this.users[index] = saved;
    else this.users.push(saved);
    return Promise.resolve({ ...saved });
  }
}
