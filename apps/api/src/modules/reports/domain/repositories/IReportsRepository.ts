import type { OrderStatus } from '@sellmanager/shared';
import type { LocalRange } from '@modules/metrics/domain/period';

export interface ISalesReportRow {
  id: string;
  paid_at: Date;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  items: number;
  total_cents: number;
  created_by: string | null;
}

export interface IProductsReportRow {
  name: string;
  category: string | null;
  price_cents: number;
  quantity: number;
  min_stock: number;
  units_sold: number;
  revenue_cents: number;
}

export interface ICustomersReportRow {
  name: string;
  email: string;
  orders: number;
  total_cents: number;
  last_purchase: Date | null;
}

export interface IReportPeriod {
  range: LocalRange;
  timezone: string;
}

/** Linhas em streaming (cursor): nunca o relatório inteiro em memória. */
export interface IReportsRepository {
  sales(
    period: IReportPeriod,
    filter: { status?: OrderStatus; customerId?: string },
  ): AsyncIterable<ISalesReportRow>;
  products(
    period: IReportPeriod,
    filter: { categoryId?: string; belowMinStock?: boolean },
  ): AsyncIterable<IProductsReportRow>;
  customers(
    period: IReportPeriod,
    filter: { onlyBuyers: boolean },
  ): AsyncIterable<ICustomersReportRow>;
}
