import { DataSource, Repository } from 'typeorm';
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

  public findAll(): Promise<User[]> {
    return this.ormRepository.find({ order: { created_at: 'ASC' } });
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
