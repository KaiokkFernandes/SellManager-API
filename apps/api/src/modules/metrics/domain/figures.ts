import { can, type Role, type SalesFigures } from '@sellmanager/shared';

/** Totais crus vindos do banco (somas e contagens). */
export interface RawSalesFigures {
  revenue_cents: number;
  orders: number;
  canceled_orders: number;
  canceled_cents: number;
}

/** Ticket médio e taxa de cancelamento a partir dos totais. */
export function toSalesFigures(raw: RawSalesFigures): SalesFigures {
  const decided = raw.orders + raw.canceled_orders;
  return {
    ...raw,
    average_ticket_cents:
      raw.orders === 0 ? 0 : Math.round(raw.revenue_cents / raw.orders),
    cancel_rate: decided === 0 ? 0 : round4(raw.canceled_orders / decided),
  };
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/** Variação relativa; null quando o anterior é zero (não existe "+∞%"). */
export function relativeChange(current: number, previous: number) {
  return previous === 0 ? null : round4((current - previous) / previous);
}

export function compareFigures(current: SalesFigures, previous: SalesFigures) {
  return {
    revenue: relativeChange(current.revenue_cents, previous.revenue_cents),
    orders: relativeChange(current.orders, previous.orders),
    average_ticket: relativeChange(
      current.average_ticket_cents,
      previous.average_ticket_cents,
    ),
    canceled_orders: relativeChange(
      current.canceled_orders,
      previous.canceled_orders,
    ),
    // taxa já é proporção: compara em pontos
    cancel_rate: round4(current.cancel_rate - previous.cancel_rate),
  };
}

/**
 * Alcance das métricas pelo mapa: quem tem report:read vê a loja; os demais,
 * só os pedidos que criaram.
 */
export function metricsScope(role: Role): 'all' | 'own' {
  return can(role, 'report:read') ? 'all' : 'own';
}
