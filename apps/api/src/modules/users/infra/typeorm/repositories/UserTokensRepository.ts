import { DataSource, Repository } from 'typeorm';
import { UserToken } from '../../../domain/entities/UserToken';
import {
  ICreateUserTokenDTO,
  IUserTokensRepository,
} from '../../../domain/repositories/IUserTokensRepository';
import { UserTokenSchema } from '../schemas/UserTokenSchema';

export class UserTokensRepository implements IUserTokensRepository {
  private readonly ormRepository: Repository<UserToken>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(UserTokenSchema);
  }

  public findByTokenHash(token_hash: string): Promise<UserToken | null> {
    return this.ormRepository.findOneBy({ token_hash });
  }

  public create(data: ICreateUserTokenDTO): Promise<UserToken> {
    return this.ormRepository.save(this.ormRepository.create(data));
  }

  public async deleteByUserId(user_id: string): Promise<void> {
    await this.ormRepository.delete({ user_id });
  }
}
