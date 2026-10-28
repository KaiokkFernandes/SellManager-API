import type { OrderStatus } from '@sellmanager/shared';

/** Uma linha do histórico: quem mudou o status, quando, de/para e por quê. */
export interface OrderStatusChange {
  id: string;
  order_id: string;
  /** null na criação do pedido. */
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  /** null em registros migrados (antes do histórico existir). */
  changed_by: { id: string; name: string } | null;
  /** Obrigatório no cancelamento. */
  reason: string | null;
  created_at: Date;
}
