import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

export class ListUsersService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  public async execute(
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<User>> {
    return paginate(await this.usersRepository.findAll(pagination), pagination);
  }
}
