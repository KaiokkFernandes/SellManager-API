import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { containsPattern } from '@shared/infra/typeorm/like';
import { User } from '../../../domain/entities/User';
import {
  ICreateUserDTO,
  IFindUsersFilter,
  IUsersRepository,
} from '../../../domain/repositories/IUsersRepository';
import { UserSchema } from '../schemas/UserSchema';

export class UsersRepository implements IUsersRepository {
  private readonly ormRepository: Repository<User>;

  // EntityManager permite usar o repositório dentro de uma transação.
  constructor(connection: DataSource | EntityManager) {
    this.ormRepository = connection.getRepository(UserSchema);
  }

  public async findAll(
    { search, role, active }: IFindUsersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<User>> {
    const query = this.ormRepository.createQueryBuilder('user');
    if (search) {
      query.andWhere(
        '(user.name ILIKE :pattern OR user.email ILIKE :pattern)',
        {
          pattern: containsPattern(search),
        },
      );
    }
    if (role) query.andWhere('user.role = :role', { role });
    if (active !== undefined)
      query.andWhere('user.active = :active', { active });

    const { skip, take } = toSkipTake(pagination);
    const [items, total] = await query
      .orderBy('user.name', 'ASC')
      .addOrderBy('user.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { items, total };
  }

  public findById(id: string): Promise<User | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public findByEmail(email: string): Promise<User | null> {
    return this.ormRepository.findOneBy({ email });
  }

  public create(data: ICreateUserDTO): Promise<User> {
    return this.ormRepository.save(
      this.ormRepository.create({
        ...data,
        active: true,
        password_changed_at: null,
      }),
    );
  }

  public save(user: User): Promise<User> {
    return this.ormRepository.save(user);
  }

  public async lockActiveAdmins(): Promise<string[]> {
    const admins = await this.ormRepository.find({
      select: { id: true },
      where: { role: 'ADMIN', active: true },
      order: { id: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
    return admins.map(admin => admin.id);
  }
}
