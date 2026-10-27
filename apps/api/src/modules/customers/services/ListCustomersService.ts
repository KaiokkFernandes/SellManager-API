import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { Customer } from '../domain/entities/Customer';
import {
  ICustomersRepository,
  IFindCustomersFilter,
} from '../domain/repositories/ICustomersRepository';

export class ListCustomersService {
  constructor(private readonly customersRepository: ICustomersRepository) {}

  public async execute(
    filter: IFindCustomersFilter = {},
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<Customer>> {
    return paginate(
      await this.customersRepository.findAll(filter, pagination),
      pagination,
    );
  }
}
