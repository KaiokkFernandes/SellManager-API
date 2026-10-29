import { DataSource } from 'typeorm';
import {
  IProductsTransactionContext,
  IProductsUnitOfWork,
} from '../../domain/repositories/IProductsUnitOfWork';
import { ProductsRepository } from './repositories/ProductsRepository';
import { StockMovementsRepository } from './repositories/StockMovementsRepository';

export class ProductsUnitOfWork implements IProductsUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  public run<T>(
    work: (context: IProductsTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(manager =>
      work({
        products: new ProductsRepository(manager),
        movements: new StockMovementsRepository(manager),
      }),
    );
  }
}
