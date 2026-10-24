import type { OrderStatus } from '@sellmanager/shared';

// Fonte única dos status: @sellmanager/shared (usado também pelo front-end).
export { ORDER_STATUSES } from '@sellmanager/shared';
export type { OrderStatus };

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  /** Preço unitário copiado do produto no momento da compra. */
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  created_at: Date;
  updated_at: Date;
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['completed', 'canceled'],
  completed: [],
  canceled: [],
};

export function canChangeOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}

/** Soma em centavos para evitar erro de ponto flutuante (0.1 + 0.2). */
export function calculateOrderTotal(
  items: Pick<OrderItem, 'price' | 'quantity'>[],
): number {
  const cents = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0,
  );
  return cents / 100;
}
