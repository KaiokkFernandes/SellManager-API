import { describe, expect, it } from 'vitest';
import { calculateOrderTotal, canChangeOrderStatus } from './Order';

describe('Order (domínio)', () => {
  it('calcula o total sem erro de ponto flutuante', () => {
    expect(
      calculateOrderTotal([
        { price: 0.1, quantity: 1 },
        { price: 0.2, quantity: 1 },
        { price: 19.99, quantity: 3 },
      ]),
    ).toBe(60.27);
  });

  it('só permite sair de pending', () => {
    expect(canChangeOrderStatus('pending', 'completed')).toBe(true);
    expect(canChangeOrderStatus('pending', 'canceled')).toBe(true);
    expect(canChangeOrderStatus('completed', 'canceled')).toBe(false);
    expect(canChangeOrderStatus('canceled', 'pending')).toBe(false);
  });
});
