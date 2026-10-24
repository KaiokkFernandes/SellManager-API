import { DataSource } from 'typeorm';
import { ProductsRepository } from '@modules/products/infra/typeorm/repositories/ProductsRepository';
import {
  IOrdersTransactionContext,
  IOrdersUnitOfWork,
} from '../../domain/repositories/IOrdersUnitOfWork';
import { OrdersRepository } from './repositories/OrdersRepository';

export class OrdersUnitOfWork implements IOrdersUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  public run<T>(
    work: (context: IOrdersTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(manager =>
      work({
        orders: new OrdersRepository(manager),
        products: new ProductsRepository(manager),
      }),
    );
  }
}
