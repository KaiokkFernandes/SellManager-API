import {
  availableOrderActions,
  ORDER_TRANSITIONS,
  type OrderAction,
  type OrderStatus,
} from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';

/**
 * ÚNICO lugar que decide se uma ação vale para o status atual (a tabela vem do
 * shared). Transição inválida: 409 INVALID_TRANSITION com as ações possíveis.
 */
export function nextOrderStatus(
  current: OrderStatus,
  action: OrderAction,
): OrderStatus {
  const transition = ORDER_TRANSITIONS[action];

  if (!transition.from.includes(current)) {
    throw new AppError(`Cannot ${action} an order that is ${current}`, 409, {
      code: 'INVALID_TRANSITION',
      details: {
        status: current,
        action,
        allowed_actions: availableOrderActions(current),
      },
    });
  }

  return transition.to;
}

/** Datas que a transição grava no pedido (o faturamento usa paid_at). */
export function statusTimestamps(
  to: OrderStatus,
  at: Date,
): { paid_at?: Date; canceled_at?: Date } {
  if (to === 'paid') return { paid_at: at };
  if (to === 'canceled') return { canceled_at: at };
  return {};
}
