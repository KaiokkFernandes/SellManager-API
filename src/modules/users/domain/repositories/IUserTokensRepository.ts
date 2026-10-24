import { UserToken } from '../entities/UserToken';

export interface IUserTokensRepository {
  findByToken(token: string): Promise<UserToken | null>;
  generate(user_id: string): Promise<UserToken>;
}
