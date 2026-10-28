import { FakeProductsRepository } from '@modules/products/fakes/FakeProductsRepository';
import {
  IOrdersTransactionContext,
  IOrdersUnitOfWork,
} from '../domain/repositories/IOrdersUnitOfWork';
import { FakeOrdersRepository } from './FakeOrdersRepository';
import { FakeOrderStatusHistoryRepository } from './FakeOrderStatusHistoryRepository';

/**
 * Simula a transação: se o trabalho falhar, restaura o estado anterior dos
 * repositórios fake (rollback), para os testes verificarem a atomicidade.
 */
export class FakeOrdersUnitOfWork implements IOrdersUnitOfWork {
  constructor(
    private readonly orders: FakeOrdersRepository,
    private readonly products: FakeProductsRepository,
    private readonly history = new FakeOrderStatusHistoryRepository(),
  ) {}

  public async run<T>(
    work: (context: IOrdersTransactionContext) => Promise<T>,
  ): Promise<T> {
    const ordersSnapshot = structuredClone(this.orders.orders);
    const productsSnapshot = structuredClone(this.products.products);
    const historySnapshot = structuredClone(this.history.rows);

    try {
      return await work({
        orders: this.orders,
        products: this.products,
        history: this.history,
      });
    } catch (error) {
      this.orders.orders.splice(0, Infinity, ...ordersSnapshot);
      this.products.products.splice(0, Infinity, ...productsSnapshot);
      this.history.rows.splice(0, Infinity, ...historySnapshot);
      throw error;
    }
  }
}
