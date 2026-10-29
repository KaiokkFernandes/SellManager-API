import { z } from 'zod';
import type { Permission } from './permissions';

/**
 * Máquina de estados do pedido. FONTE ÚNICA: o domínio da API valida cada
 * transição com esta tabela e o front só a lê para decidir quais ações mostrar.
 *
 *   pending → paid → shipped → delivered
 *   pending | paid → canceled (com motivo; devolve o estoque)
 */
export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'canceled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const ORDER_ACTIONS = ['pay', 'ship', 'deliver', 'cancel'] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

interface OrderTransition {
  from: readonly OrderStatus[];
  to: OrderStatus;
  /** Permissão do mapa exigida para executar a ação. */
  permission: Permission;
}

export const ORDER_TRANSITIONS: Record<OrderAction, OrderTransition> = {
  pay: { from: ['pending'], to: 'paid', permission: 'order:pay' },
  ship: { from: ['paid'], to: 'shipped', permission: 'order:ship' },
  deliver: { from: ['shipped'], to: 'delivered', permission: 'order:deliver' },
  // nada saiu da loja antes do envio: cancelar devolve todos os itens
  cancel: {
    from: ['pending', 'paid'],
    to: 'canceled',
    permission: 'order:cancel',
  },
};

/** Ações possíveis a partir do status (sem considerar o papel). */
export function availableOrderActions(status: OrderStatus): OrderAction[] {
  return ORDER_ACTIONS.filter(action =>
    ORDER_TRANSITIONS[action].from.includes(status),
  );
}

/** Status final, sem ações possíveis. */
export function isFinalOrderStatus(status: OrderStatus): boolean {
  return availableOrderActions(status).length === 0;
}
