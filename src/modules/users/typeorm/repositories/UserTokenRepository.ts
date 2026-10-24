import { Repository } from 'typeorm';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import UserToken from '../entities/UserToken';

class UserTokenRepository {
  private ormRepository: Repository<UserToken>;

  constructor() {
    this.ormRepository = AppDataSource.getRepository(UserToken);
  }

  public async findByToken(token: string): Promise<UserToken | null> {
    return this.ormRepository.findOneBy({ token });
  }

  public async generate(user_id: string): Promise<UserToken> {
    const userToken = this.ormRepository.create({ user_id });
    return this.ormRepository.save(userToken);
  }
}

export default UserTokenRepository;
