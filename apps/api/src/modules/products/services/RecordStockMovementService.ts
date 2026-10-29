import type { ManualStockMovementType } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';
import { StockMovement } from '../domain/entities/StockMovement';
import { IProductsUnitOfWork } from '../domain/repositories/IProductsUnitOfWork';
import { StockLedger } from '../domain/StockLedger';

interface IRequest {
  product_id: string;
  type: ManualStockMovementType;
  quantity: number;
  reason?: string;
  created_by: string;
}

/** Entrada de mercadoria ou ajuste manual (com motivo). */
export class RecordStockMovementService {
  constructor(private readonly unitOfWork: IProductsUnitOfWork) {}

  public execute({ product_id, ...move }: IRequest): Promise<StockMovement> {
    return this.unitOfWork.run(async ({ products, movements }) => {
      // trava o produto: venda e ajuste simultâneos não leem o mesmo saldo
      const [product] = await products.findByIdsForUpdate([product_id]);

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      return new StockLedger(products, movements).move(product, move);
    });
  }
}
