import { IProductsRepository } from './IProductsRepository';
import { IStockMovementsRepository } from './IStockMovementsRepository';

export interface IProductsTransactionContext {
  products: IProductsRepository;
  movements: IStockMovementsRepository;
}

/** Produto e movimentações de estoque gravados juntos (ou nada). */
export interface IProductsUnitOfWork {
  run<T>(
    work: (context: IProductsTransactionContext) => Promise<T>,
  ): Promise<T>;
}
