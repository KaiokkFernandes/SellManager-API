import type {
  MetricsSummary,
  OrdersByStatus,
  RevenueSeries,
  SalesByCategory,
  TopCustomers,
  TopProducts,
} from '@sellmanager/api-client';

/** Métricas de exemplo (período 30 dias até 29/10/2026). */
export const period = {
  preset: '30d',
  timezone: 'America/Sao_Paulo',
  current: { from: '2026-09-30', to: '2026-10-29' },
  previous: { from: '2026-08-31', to: '2026-09-29' },
} satisfies MetricsSummary['period'];

export const summary = {
  period,
  scope: 'all',
  current: {
    revenue_cents: 1_234_550,
    orders: 50,
    average_ticket_cents: 24_691,
    canceled_orders: 5,
    canceled_cents: 98_000,
    cancel_rate: 0.0909,
  },
  previous: {
    revenue_cents: 1_000_000,
    orders: 40,
    average_ticket_cents: 25_000,
    canceled_orders: 2,
    canceled_cents: 30_000,
    cancel_rate: 0.0476,
  },
  change: {
    revenue: 0.2346,
    orders: 0.25,
    average_ticket: -0.0124,
    canceled_orders: 1.5,
    cancel_rate: 0.0433,
  },
} satisfies MetricsSummary;

export const revenue = {
  period,
  scope: 'all',
  granularity: 'day',
  points: [
    { bucket: '2026-10-27', revenue_cents: 50_000, orders: 2 },
    { bucket: '2026-10-28', revenue_cents: 0, orders: 0 },
    { bucket: '2026-10-29', revenue_cents: 74_900, orders: 3 },
  ],
} satisfies RevenueSeries;

export const topProducts = {
  period,
  scope: 'all',
  items: [
    {
      product: {
        id: '9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d01',
        name: 'Cabo USB-C',
      },
      units: 30,
      revenue_cents: 149_700,
    },
  ],
} satisfies TopProducts;

export const topCustomers = {
  period,
  scope: 'all',
  items: [
    {
      customer: {
        id: '6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
        name: 'Ana Souza',
        email: 'ana@example.com',
      },
      orders: 4,
      revenue_cents: 99_800,
    },
  ],
} satisfies TopCustomers;

export const categories = {
  period,
  scope: 'all',
  items: [
    {
      category: { id: '2f1d3c4b-5a69-4788-9a0b-1c2d3e4f5a6b', name: 'Cabos' },
      units: 30,
      revenue_cents: 149_700,
    },
    { category: null, units: 2, revenue_cents: 10_000 },
  ],
} satisfies SalesByCategory;

export const statuses = {
  period,
  scope: 'all',
  items: [
    { status: 'pending', orders: 3, total_cents: 10_000 },
    { status: 'paid', orders: 2, total_cents: 20_000 },
    { status: 'shipped', orders: 1, total_cents: 5_000 },
    { status: 'delivered', orders: 44, total_cents: 1_199_550 },
    { status: 'canceled', orders: 5, total_cents: 98_000 },
  ],
} satisfies OrdersByStatus;
