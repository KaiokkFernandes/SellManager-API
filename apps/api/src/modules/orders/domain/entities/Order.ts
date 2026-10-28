import type { OrderStatus } from '@sellmanager/shared';

// Fonte única dos status: @sellmanager/shared (usado também pelo front-end).
export { ORDER_STATUSES } from '@sellmanager/shared';
export type { OrderStatus };

/** Resumo do cliente, carregado junto do pedido (evita N+1 na listagem). */
export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
}

/** Resumo do produto do item (nome atual; o preço do item é o da compra). */
export interface OrderProduct {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product: OrderProduct;
  /** Preço unitário copiado do produto no momento da compra. */
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer: OrderCustomer;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  created_at: Date;
  updated_at: Date;
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
