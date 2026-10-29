import type { MetricsGranularity, OrderStatus } from '@sellmanager/shared';
import { RawSalesFigures } from '../figures';
import { LocalRange } from '../period';

export interface IMetricsFilter {
  timezone: string;
  /** Só pedidos criados por este usuário (escopo "own"). */
  createdBy?: string;
}

export interface IRevenuePoint {
  /** Início do balde (dia, segunda-feira da semana ou dia 1 do mês). */
  bucket: string;
  revenue_cents: number;
  orders: number;
}

export interface ITopProduct {
  product: { id: string; name: string };
  units: number;
  revenue_cents: number;
}

export interface ITopCustomer {
  customer: { id: string; name: string; email: string };
  orders: number;
  revenue_cents: number;
}

export interface ICategorySales {
  category: { id: string; name: string } | null;
  units: number;
  revenue_cents: number;
}

export interface IStatusCount {
  status: OrderStatus;
  orders: number;
  total_cents: number;
}

/** Consultas agregadas no banco: nunca carregam pedidos em memória. */
export interface IMetricsRepository {
  salesFigures(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<RawSalesFigures>;
  /** Todos os baldes do período, inclusive os sem venda (zero). */
  revenueSeries(
    range: LocalRange,
    granularity: MetricsGranularity,
    filter: IMetricsFilter,
  ): Promise<IRevenuePoint[]>;
  topProducts(
    range: LocalRange,
    limit: number,
    filter: IMetricsFilter,
  ): Promise<ITopProduct[]>;
  topCustomers(
    range: LocalRange,
    limit: number,
    filter: IMetricsFilter,
  ): Promise<ITopCustomer[]>;
  salesByCategory(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<ICategorySales[]>;
  /** Pedidos CRIADOS no período, pelo status atual (só os que existem). */
  ordersByStatus(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<IStatusCount[]>;
}
