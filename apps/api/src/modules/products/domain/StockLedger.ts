import type { StockMovementType } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';
import { Product } from './entities/Product';
import { StockMovement } from './entities/StockMovement';
import { IProductsRepository } from './repositories/IProductsRepository';
import { IStockMovementsRepository } from './repositories/IStockMovementsRepository';

export interface IStockMove {
  type: StockMovementType;
  /** Com sinal: positiva entra, negativa sai. */
  quantity: number;
  reason?: string;
  order_id?: string;
  /** Usuário responsável. */
  created_by: string;
}

/** Sinal exigido por tipo; o ajuste manual pode ir para os dois lados. */
const SIGN: Record<StockMovementType, 1 | -1 | 0> = {
  INITIAL: 1,
  ENTRY: 1,
  SALE: -1,
  CANCEL_RETURN: 1,
  ADJUSTMENT: 0,
};

function assertValidMove({ type, quantity, reason, order_id }: IStockMove) {
  const sign = SIGN[type];
  if (
    !Number.isInteger(quantity) ||
    quantity === 0 ||
    (sign !== 0 && Math.sign(quantity) !== sign)
  ) {
    throw new AppError(`Invalid quantity ${quantity} for ${type}`, 400);
  }
  if (type === 'ADJUSTMENT' && (reason?.trim().length ?? 0) < 3) {
    throw new AppError('A reason is required for a stock adjustment', 400);
  }
  if ((type === 'SALE' || type === 'CANCEL_RETURN') && !order_id) {
    throw new AppError(`${type} must reference an order`, 400);
  }
}

/**
 * ÚNICO caminho para mudar o estoque: grava a movimentação e o novo saldo do
 * produto juntos, então o saldo sempre bate com a soma das movimentações.
 * Quem chama roda numa transação com o produto já travado
 * (findByIdsForUpdate), para que duas operações não leiam o mesmo saldo.
 */
export class StockLedger {
  constructor(
    private readonly products: IProductsRepository,
    private readonly movements: IStockMovementsRepository,
  ) {}

  public async move(
    product: Product,
    move: IStockMove,
  ): Promise<StockMovement> {
    assertValidMove(move);

    const balance = product.quantity + move.quantity;
    if (balance < 0) {
      throw new AppError('Insufficient stock', 409, {
        code: 'INSUFFICIENT_STOCK',
        details: [
          {
            product_id: product.id,
            available: product.quantity,
            requested: -move.quantity,
          },
        ],
      });
    }

    product.quantity = balance;
    await this.products.save(product);

    return this.movements.add({
      product_id: product.id,
      type: move.type,
      quantity: move.quantity,
      balance_after: balance,
      reason: move.reason?.trim() || null,
      order_id: move.order_id ?? null,
      created_by_id: move.created_by,
    });
  }
}
