import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import AppError from '@shared/errors/AppError';
import { StockMovement } from '../domain/entities/StockMovement';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';
import { IStockMovementsRepository } from '../domain/repositories/IStockMovementsRepository';

export class ListStockMovementsService {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly movementsRepository: IStockMovementsRepository,
  ) {}

  public async execute(
    { product_id }: { product_id: string },
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<StockMovement>> {
    if (!(await this.productsRepository.findById(product_id))) {
      throw new AppError('Product not found', 404);
    }

    return paginate(
      await this.movementsRepository.findByProduct(product_id, pagination),
      pagination,
    );
  }
}
