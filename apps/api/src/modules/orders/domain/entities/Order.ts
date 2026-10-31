import type { OrderStatus } from '@sellmanager/shared';
import type { OrderStatusChange } from './OrderStatusChange';

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
  /** Quando o pagamento foi registrado (base do faturamento); null se não pago. */
  paid_at: Date | null;
  /** Quando foi cancelado; null se não cancelado. */
  canceled_at: Date | null;
  /** Quem criou (escopo "próprios números" do vendedor); null em pedidos migrados sem autor. */
  created_by: string | null;
  items: OrderItem[];
  created_at: Date;
  updated_at: Date;
}

/** Pedido com o histórico de status (detalhe e respostas das transições). */
export interface OrderDetails extends Order {
  history: OrderStatusChange[];
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
