import { DataSource, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { User } from '../../../domain/entities/User';
import {
  ICreateUserDTO,
  IUsersRepository,
} from '../../../domain/repositories/IUsersRepository';
import { UserSchema } from '../schemas/UserSchema';

export class UsersRepository implements IUsersRepository {
  private readonly ormRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(UserSchema);
  }

  public async findAll(
    pagination: PaginationParams,
  ): Promise<PageResult<User>> {
    const [items, total] = await this.ormRepository.findAndCount({
      order: { created_at: 'ASC', id: 'ASC' },
      ...toSkipTake(pagination),
    });
    return { items, total };
  }

  public findById(id: string): Promise<User | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public findByEmail(email: string): Promise<User | null> {
    return this.ormRepository.findOneBy({ email });
  }

  public create(data: ICreateUserDTO): Promise<User> {
    return this.ormRepository.save(this.ormRepository.create(data));
  }

  public save(user: User): Promise<User> {
    return this.ormRepository.save(user);
  }
}
