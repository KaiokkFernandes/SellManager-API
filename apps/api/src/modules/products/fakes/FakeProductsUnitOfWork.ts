import {
  IProductsTransactionContext,
  IProductsUnitOfWork,
} from '../domain/repositories/IProductsUnitOfWork';
import { FakeProductsRepository } from './FakeProductsRepository';
import { FakeStockMovementsRepository } from './FakeStockMovementsRepository';

/** Simula a transação: se o trabalho falhar, restaura produtos e movimentações. */
export class FakeProductsUnitOfWork implements IProductsUnitOfWork {
  constructor(
    private readonly products: FakeProductsRepository,
    private readonly movements: FakeStockMovementsRepository,
  ) {}

  public async run<T>(
    work: (context: IProductsTransactionContext) => Promise<T>,
  ): Promise<T> {
    const productsSnapshot = structuredClone(this.products.products);
    const movementsSnapshot = structuredClone(this.movements.movements);

    try {
      return await work({ products: this.products, movements: this.movements });
    } catch (error) {
      this.products.products.splice(0, Infinity, ...productsSnapshot);
      this.movements.movements.splice(0, Infinity, ...movementsSnapshot);
      throw error;
    }
  }
}
