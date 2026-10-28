import type { OrderAction } from '@sellmanager/shared';
import { StockLedger } from '@modules/products/domain/StockLedger';
import AppError from '@shared/errors/AppError';
import { OrderDetails } from '../domain/entities/Order';
import { nextOrderStatus } from '../domain/orderWorkflow';
import { IOrdersUnitOfWork } from '../domain/repositories/IOrdersUnitOfWork';

interface IRequest {
  id: string;
  action: OrderAction;
  /** Obrigatório no cancelamento. */
  reason?: string;
  /** Usuário que fez a mudança (vai para o histórico). */
  changed_by: string;
}

/** Pagar, enviar, entregar ou cancelar: valida a transição no domínio. */
export class ChangeOrderStatusService {
  constructor(private readonly unitOfWork: IOrdersUnitOfWork) {}

  public execute({
    id,
    action,
    reason,
    changed_by,
  }: IRequest): Promise<OrderDetails> {
    return this.unitOfWork.run(
      async ({ orders, products, history, movements }) => {
        // trava o pedido: duas mudanças simultâneas não passam do mesmo status
        const order = await orders.findByIdForUpdate(id);

        if (!order) {
          throw new AppError('Order not found', 404);
        }

        const status = nextOrderStatus(order.status, action);

        if (action === 'cancel') {
          if (!reason?.trim()) {
            throw new AppError('A reason is required to cancel an order', 400);
          }

          // cancelar devolve os itens ao estoque
          const lockedProducts = await products.findByIdsForUpdate(
            order.items.map(item => item.product_id),
          );

          const ledger = new StockLedger(products, movements);
          for (const product of lockedProducts) {
            const item = order.items.find(
              orderItem => orderItem.product_id === product.id,
            );
            await ledger.move(product, {
              type: 'CANCEL_RETURN',
              quantity: item?.quantity ?? 0,
              order_id: id,
              created_by: changed_by,
            });
          }
        }

        const updated = await orders.updateStatus(id, status);
        await history.add({
          order_id: id,
          from_status: order.status,
          to_status: status,
          changed_by_id: changed_by,
          reason: action === 'cancel' ? reason?.trim() : undefined,
        });
        return { ...updated, history: await history.findByOrder(id) };
      },
    );
  }
}
