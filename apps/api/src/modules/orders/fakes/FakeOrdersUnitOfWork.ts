import { FakeProductsRepository } from '@modules/products/fakes/FakeProductsRepository';
import {
  IOrdersTransactionContext,
  IOrdersUnitOfWork,
} from '../domain/repositories/IOrdersUnitOfWork';
import { FakeOrdersRepository } from './FakeOrdersRepository';

/**
 * Simula a transação: se o trabalho falhar, restaura o estado anterior dos
 * repositórios fake (rollback), para os testes verificarem a atomicidade.
 */
export class FakeOrdersUnitOfWork implements IOrdersUnitOfWork {
  constructor(
    private readonly orders: FakeOrdersRepository,
    private readonly products: FakeProductsRepository,
  ) {}

  public async run<T>(
    work: (context: IOrdersTransactionContext) => Promise<T>,
  ): Promise<T> {
    const ordersSnapshot = structuredClone(this.orders.orders);
    const productsSnapshot = structuredClone(this.products.products);

    try {
      return await work({ orders: this.orders, products: this.products });
    } catch (error) {
      this.orders.orders.splice(0, Infinity, ...ordersSnapshot);
      this.products.products.splice(0, Infinity, ...productsSnapshot);
      throw error;
    }
  }
}
