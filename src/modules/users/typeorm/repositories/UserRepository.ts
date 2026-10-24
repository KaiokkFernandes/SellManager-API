import { Repository } from 'typeorm';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import Users from '../entities/Users';

interface ICreateUser {
  name: string;
  email: string;
  password: string;
}

class UserRepository {
  private ormRepository: Repository<Users>;

  constructor() {
    this.ormRepository = AppDataSource.getRepository(Users);
  }

  public async findAll(): Promise<Users[]> {
    return this.ormRepository.find();
  }

  public async findById(id: string): Promise<Users | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public async findByEmail(email: string): Promise<Users | null> {
    return this.ormRepository.findOneBy({ email });
  }

  public async create(data: ICreateUser): Promise<Users> {
    const user = this.ormRepository.create(data);
    return this.ormRepository.save(user);
  }

  public async save(user: Users): Promise<Users> {
    return this.ormRepository.save(user);
  }
}

export default UserRepository;
