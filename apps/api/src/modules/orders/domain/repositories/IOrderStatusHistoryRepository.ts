import type { OrderStatus } from '@sellmanager/shared';
import { OrderStatusChange } from '../entities/OrderStatusChange';

export interface IAddOrderStatusChangeDTO {
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by_id: string;
  reason?: string;
}

export interface IOrderStatusHistoryRepository {
  add(data: IAddOrderStatusChangeDTO): Promise<void>;
  /** Em ordem cronológica. */
  findByOrder(orderId: string): Promise<OrderStatusChange[]>;
}
