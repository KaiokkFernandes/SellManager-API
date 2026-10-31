import { describe, expect, it } from 'vitest';
import {
  compareFigures,
  metricsScope,
  relativeChange,
  toSalesFigures,
} from './figures';

describe('indicadores', () => {
  it('ticket médio arredondado e taxa = cancelados ÷ (vendas + cancelados)', () => {
    expect(
      toSalesFigures({
        revenue_cents: 1000,
        orders: 3,
        canceled_orders: 1,
        canceled_cents: 500,
      }),
    ).toEqual({
      revenue_cents: 1000,
      orders: 3,
      average_ticket_cents: 333,
      canceled_orders: 1,
      canceled_cents: 500,
      cancel_rate: 0.25,
    });
  });

  it('sem pedidos: ticket e taxa zerados (sem divisão por zero)', () => {
    expect(
      toSalesFigures({
        revenue_cents: 0,
        orders: 0,
        canceled_orders: 0,
        canceled_cents: 0,
      }),
    ).toMatchObject({ average_ticket_cents: 0, cancel_rate: 0 });
  });

  it('variação relativa; null quando o anterior é zero', () => {
    expect(relativeChange(150, 100)).toBe(0.5);
    expect(relativeChange(50, 100)).toBe(-0.5);
    expect(relativeChange(10, 0)).toBeNull();
  });

  it('taxa de cancelamento compara em pontos', () => {
    const base = {
      revenue_cents: 100,
      orders: 1,
      average_ticket_cents: 100,
      canceled_orders: 0,
      canceled_cents: 0,
    };
    expect(
      compareFigures(
        { ...base, cancel_rate: 0.3 },
        { ...base, cancel_rate: 0.1 },
      ).cancel_rate,
    ).toBe(0.2);
  });

  it('alcance pelo mapa: report:read vê a loja, os demais só os próprios', () => {
    expect(metricsScope('ADMIN')).toBe('all');
    expect(metricsScope('MANAGER')).toBe('all');
    expect(metricsScope('SELLER')).toBe('own');
  });
});
