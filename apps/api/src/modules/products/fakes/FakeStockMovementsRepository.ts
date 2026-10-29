import { randomUUID } from 'node:crypto';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { StockMovement } from '../domain/entities/StockMovement';
import {
  IAddStockMovementDTO,
  IStockMovementsRepository,
} from '../domain/repositories/IStockMovementsRepository';

export class FakeStockMovementsRepository implements IStockMovementsRepository {
  public readonly movements: StockMovement[] = [];

  public add({
    created_by_id,
    ...data
  }: IAddStockMovementDTO): Promise<StockMovement> {
    const movement: StockMovement = {
      ...data,
      id: randomUUID(),
      created_by: { id: created_by_id, name: '' },
      created_at: new Date(),
    };
    this.movements.push(movement);
    return Promise.resolve({ ...movement });
  }

  public findByProduct(
    productId: string,
    pagination: PaginationParams,
  ): Promise<PageResult<StockMovement>> {
    return Promise.resolve(
      slicePage(
        this.movements
          .filter(movement => movement.product_id === productId)
          .reverse(),
        pagination,
      ),
    );
  }

  /** Soma das movimentações de um produto (invariante do saldo). */
  public sumFor(productId: string): number {
    return this.movements
      .filter(movement => movement.product_id === productId)
      .reduce((sum, movement) => sum + movement.quantity, 0);
  }
}
