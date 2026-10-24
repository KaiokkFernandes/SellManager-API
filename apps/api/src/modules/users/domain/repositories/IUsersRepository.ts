import { User } from '../entities/User';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface IUsersRepository {
  findAll(pagination: PaginationParams): Promise<PageResult<User>>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: ICreateUserDTO): Promise<User>;
  save(user: User): Promise<User>;
}
