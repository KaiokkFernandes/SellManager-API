import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

/** Produtos abaixo do estoque mínimo (alerta do layout). */
export class ListLowStockProductsService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute(
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<Product>> {
    return paginate(
      await this.productsRepository.findBelowMinStock(pagination),
      pagination,
    );
  }
}
