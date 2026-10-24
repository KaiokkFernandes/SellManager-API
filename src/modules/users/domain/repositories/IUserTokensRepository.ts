import { UserToken } from '../entities/UserToken';

export interface ICreateUserTokenDTO {
  user_id: string;
  token_hash: string;
}

export interface IUserTokensRepository {
  findByTokenHash(token_hash: string): Promise<UserToken | null>;
  create(data: ICreateUserTokenDTO): Promise<UserToken>;
  deleteByUserId(user_id: string): Promise<void>;
}
