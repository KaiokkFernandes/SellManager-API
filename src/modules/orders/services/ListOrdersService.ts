import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { Order } from '../domain/entities/Order';
import {
  IFindOrdersFilter,
  IOrdersRepository,
} from '../domain/repositories/IOrdersRepository';

export class ListOrdersService {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  public async execute(
    filter: IFindOrdersFilter = {},
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<Order>> {
    return paginate(
      await this.ordersRepository.findAll(filter, pagination),
      pagination,
    );
  }
}
