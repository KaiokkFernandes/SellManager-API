import { PageResult, PaginationParams } from '@shared/domain/pagination';
import { StockMovement } from '../entities/StockMovement';

export interface IAddStockMovementDTO extends Pick<
  StockMovement,
  'product_id' | 'type' | 'quantity' | 'balance_after' | 'reason' | 'order_id'
> {
  created_by_id: string;
}

export interface IStockMovementsRepository {
  add(data: IAddStockMovementDTO): Promise<StockMovement>;
  /** Mais recentes primeiro. */
  findByProduct(
    productId: string,
    pagination: PaginationParams,
  ): Promise<PageResult<StockMovement>>;
}
