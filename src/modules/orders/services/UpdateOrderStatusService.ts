import AppError from '@shared/errors/AppError';
import {
  canChangeOrderStatus,
  Order,
  OrderStatus,
} from '../domain/entities/Order';
import { IOrdersUnitOfWork } from '../domain/repositories/IOrdersUnitOfWork';

interface IRequest {
  id: string;
  status: OrderStatus;
}

export class UpdateOrderStatusService {
  constructor(private readonly unitOfWork: IOrdersUnitOfWork) {}

  public execute({ id, status }: IRequest): Promise<Order> {
    return this.unitOfWork.run(async ({ orders, products }) => {
      const order = await orders.findByIdForUpdate(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (!canChangeOrderStatus(order.status, status)) {
        throw new AppError(
          `Cannot change order status from ${order.status} to ${status}`,
          409,
        );
      }

      // Cancelar devolve os itens ao estoque.
      if (status === 'canceled') {
        const lockedProducts = await products.findByIdsForUpdate(
          order.items.map(item => item.product_id),
        );

        for (const product of lockedProducts) {
          const item = order.items.find(
            orderItem => orderItem.product_id === product.id,
          );
          product.quantity += item?.quantity ?? 0;
          await products.save(product);
        }
      }

      return orders.updateStatus(id, status);
    });
  }
}
