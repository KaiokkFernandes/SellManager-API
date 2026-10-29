import type { StockMovementType } from '@sellmanager/shared';

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType;
  /** Com sinal: positiva entra, negativa sai. */
  quantity: number;
  /** Saldo do produto logo após a movimentação. */
  balance_after: number;
  reason: string | null;
  /** Pedido de origem (SALE e CANCEL_RETURN). */
  order_id: string | null;
  /** null em registros migrados. */
  created_by: { id: string; name: string } | null;
  created_at: Date;
}
