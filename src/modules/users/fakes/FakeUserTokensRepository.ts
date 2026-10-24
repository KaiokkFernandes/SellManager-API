import { randomUUID } from 'node:crypto';
import { UserToken } from '../domain/entities/UserToken';
import { IUserTokensRepository } from '../domain/repositories/IUserTokensRepository';

export class FakeUserTokensRepository implements IUserTokensRepository {
  public readonly tokens: UserToken[] = [];

  public findByToken(token: string): Promise<UserToken | null> {
    return Promise.resolve(
      this.tokens.find(item => item.token === token) ?? null,
    );
  }

  public generate(user_id: string): Promise<UserToken> {
    const now = new Date();
    const userToken: UserToken = {
      id: randomUUID(),
      token: randomUUID(),
      user_id,
      created_at: now,
      updated_at: now,
    };
    this.tokens.push(userToken);
    return Promise.resolve({ ...userToken });
  }
}
