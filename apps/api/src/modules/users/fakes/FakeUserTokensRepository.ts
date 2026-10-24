import { randomUUID } from 'node:crypto';
import { UserToken } from '../domain/entities/UserToken';
import {
  ICreateUserTokenDTO,
  IUserTokensRepository,
} from '../domain/repositories/IUserTokensRepository';

export class FakeUserTokensRepository implements IUserTokensRepository {
  public tokens: UserToken[] = [];

  public findByTokenHash(token_hash: string): Promise<UserToken | null> {
    const found = this.tokens.find(item => item.token_hash === token_hash);
    return Promise.resolve(found ? { ...found } : null);
  }

  public create(data: ICreateUserTokenDTO): Promise<UserToken> {
    const now = new Date();
    const userToken: UserToken = {
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      ...data,
    };
    this.tokens.push(userToken);
    return Promise.resolve({ ...userToken });
  }

  public deleteByUserId(user_id: string): Promise<void> {
    this.tokens = this.tokens.filter(item => item.user_id !== user_id);
    return Promise.resolve();
  }
}
