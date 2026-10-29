import {
  ORDER_ACTIONS,
  ORDER_STATUSES,
  type OrderAction,
  type OrderStatus,
} from '@sellmanager/shared';
import { describe, expect, it } from 'vitest';
import { nextOrderStatus } from './orderWorkflow';

/**
 * Tabela esperada escrita à mão (não derivada da implementação): status ×
 * ação → próximo status, ou null quando a transição é inválida.
 */
const EXPECTED: Record<OrderStatus, Record<OrderAction, OrderStatus | null>> = {
  pending: { pay: 'paid', ship: null, deliver: null, cancel: 'canceled' },
  paid: { pay: null, ship: 'shipped', deliver: null, cancel: 'canceled' },
  shipped: { pay: null, ship: null, deliver: 'delivered', cancel: null },
  delivered: { pay: null, ship: null, deliver: null, cancel: null },
  canceled: { pay: null, ship: null, deliver: null, cancel: null },
};

const cases = ORDER_STATUSES.flatMap(status =>
  ORDER_ACTIONS.map(action => ({
    status,
    action,
    expected: EXPECTED[status][action],
  })),
);

describe('máquina de estados do pedido', () => {
  it('cobre todas as combinações de status e ação', () => {
    expect(cases).toHaveLength(ORDER_STATUSES.length * ORDER_ACTIONS.length);
  });

  it.each(cases.filter(({ expected }) => expected !== null))(
    '$status --$action--> $expected',
    ({ status, action, expected }) => {
      expect(nextOrderStatus(status, action)).toBe(expected);
    },
  );

  it.each(cases.filter(({ expected }) => expected === null))(
    '$status --$action--> 409 INVALID_TRANSITION',
    ({ status, action }) => {
      let error: unknown;
      try {
        nextOrderStatus(status, action);
      } catch (caught) {
        error = caught;
      }
      expect(error).toMatchObject({
        statusCode: 409,
        code: 'INVALID_TRANSITION',
        message: `Cannot ${action} an order that is ${status}`,
        details: {
          status,
          action,
          allowed_actions: ORDER_ACTIONS.filter(
            other => EXPECTED[status][other] !== null,
          ),
        },
      });
    },
  );
});
