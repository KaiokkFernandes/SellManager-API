import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { User } from '../domain/entities/User';
import {
  IFindUsersFilter,
  IUsersRepository,
} from '../domain/repositories/IUsersRepository';

export class ListUsersService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  public async execute(
    filter: IFindUsersFilter = {},
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<User>> {
    return paginate(
      await this.usersRepository.findAll(filter, pagination),
      pagination,
    );
  }
}
