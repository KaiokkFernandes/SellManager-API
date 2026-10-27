import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { Product } from '../domain/entities/Product';
import {
  IFindProductsFilter,
  IProductsRepository,
} from '../domain/repositories/IProductsRepository';

export class ListProductsService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute(
    filter: IFindProductsFilter = {},
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<Product>> {
    return paginate(
      await this.productsRepository.findAll(filter, pagination),
      pagination,
    );
  }
}
