import { randomUUID } from 'node:crypto';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { matchesSearch, sortInMemory } from '@shared/domain/listing';
import { User } from '../domain/entities/User';
import {
  ICreateUserDTO,
  IFindUsersFilter,
  IUsersRepository,
} from '../domain/repositories/IUsersRepository';

export class FakeUsersRepository implements IUsersRepository {
  public readonly users: User[] = [];

  public findAll(
    { search, role, active }: IFindUsersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<User>> {
    const found = this.users.filter(
      user =>
        matchesSearch(search, user.name, user.email) &&
        (!role || user.role === role) &&
        (active === undefined || user.active === active),
    );
    return Promise.resolve(
      slicePage(
        sortInMemory(found, user => user.name),
        pagination,
      ),
    );
  }

  public lockActiveAdmins(): Promise<string[]> {
    return Promise.resolve(
      this.users
        .filter(user => user.role === 'ADMIN' && user.active)
        .map(user => user.id),
    );
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
      active: true,
      password_changed_at: null,
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
