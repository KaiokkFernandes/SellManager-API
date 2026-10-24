import { DataSource, Repository } from 'typeorm';
import { UserToken } from '../../../domain/entities/UserToken';
import { IUserTokensRepository } from '../../../domain/repositories/IUserTokensRepository';
import { UserTokenSchema } from '../schemas/UserTokenSchema';

export class UserTokensRepository implements IUserTokensRepository {
  private readonly ormRepository: Repository<UserToken>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(UserTokenSchema);
  }

  public findByToken(token: string): Promise<UserToken | null> {
    return this.ormRepository.findOneBy({ token });
  }

  public generate(user_id: string): Promise<UserToken> {
    return this.ormRepository.save(this.ormRepository.create({ user_id }));
  }
}
