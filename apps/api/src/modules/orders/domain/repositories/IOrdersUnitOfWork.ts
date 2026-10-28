import { IProductsRepository } from '@modules/products/domain/repositories/IProductsRepository';
import { IOrderStatusHistoryRepository } from './IOrderStatusHistoryRepository';
import { IOrdersRepository } from './IOrdersRepository';

export interface IOrdersTransactionContext {
  orders: IOrdersRepository;
  products: IProductsRepository;
  history: IOrderStatusHistoryRepository;
}

/**
 * Executa o trabalho de forma atômica: ou tudo é persistido (pedido + baixa de
 * estoque) ou nada é. Os repositórios recebidos participam da mesma transação.
 */
export interface IOrdersUnitOfWork {
  run<T>(work: (context: IOrdersTransactionContext) => Promise<T>): Promise<T>;
}
