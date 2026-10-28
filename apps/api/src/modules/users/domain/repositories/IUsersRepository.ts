import { Role, User } from '../entities/User';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface IFindUsersFilter {
  /** Busca em nome ou e-mail. */
  search?: string;
  role?: Role;
  active?: boolean;
}

export interface IUsersRepository {
  findAll(
    filter: IFindUsersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<User>>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: ICreateUserDTO): Promise<User>;
  save(user: User): Promise<User>;
  /**
   * Ids dos ADMINs ativos, travando essas linhas até o fim da unidade de
   * trabalho: duas mudanças simultâneas não deixam o sistema sem ADMIN.
   */
  lockActiveAdmins(): Promise<string[]>;
}
