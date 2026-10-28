import type {
  OrderDetails as OrderDetailsResponse,
  Order as OrderResponse,
} from '@sellmanager/shared';
import { toCents } from '@shared/http/money';
import { Order, OrderDetails } from '../../domain/entities/Order';

export function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    customer_id: order.customer_id,
    customer: { ...order.customer },
    status: order.status,
    total_cents: toCents(order.total),
    items: order.items.map(item => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      product: { ...item.product },
      price_cents: toCents(item.price),
      quantity: item.quantity,
    })),
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
  };
}

export function toOrderDetailsResponse(
  order: OrderDetails,
): OrderDetailsResponse {
  return {
    ...toOrderResponse(order),
    history: order.history.map(change => ({
      id: change.id,
      from_status: change.from_status,
      to_status: change.to_status,
      changed_by: change.changed_by ? { ...change.changed_by } : null,
      reason: change.reason,
      created_at: change.created_at.toISOString(),
    })),
  };
}
