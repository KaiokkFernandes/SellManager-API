import type { MetricsGranularity } from '@sellmanager/shared';
import { DataSource } from 'typeorm';
import { RawSalesFigures } from '../../domain/figures';
import { CANCELED, cents, CREATED, SOLD } from './salesSql';
import { LocalRange } from '../../domain/period';
import {
  ICategorySales,
  IMetricsFilter,
  IMetricsRepository,
  IRevenuePoint,
  IStatusCount,
  ITopCustomer,
  ITopProduct,
} from '../../domain/repositories/IMetricsRepository';

type Row<T> = { [K in keyof T]: string };

export class MetricsRepository implements IMetricsRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * [from, to, fuso, ...extras, autor?]: o filtro de autor entra como SQL só
   * no escopo "own" (assim o plano usa o índice certo em cada caso).
   */
  private params(
    { from, to }: LocalRange,
    { timezone, createdBy }: IMetricsFilter,
    extras: unknown[] = [],
  ): { values: unknown[]; byAuthor: string } {
    const values = [from, to, timezone, ...extras];
    if (!createdBy) return { values, byAuthor: '' };
    values.push(createdBy);
    return { values, byAuthor: `AND o.created_by = $${values.length}` };
  }

  public async salesFigures(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<RawSalesFigures> {
    const { values, byAuthor } = this.params(range, filter);
    const [row] = await this.dataSource.query<[Row<RawSalesFigures>]>(
      `SELECT
         ${cents('o.total', SOLD)} AS revenue_cents,
         COUNT(*) FILTER (WHERE ${SOLD})::int AS orders,
         COUNT(*) FILTER (WHERE ${CANCELED})::int AS canceled_orders,
         ${cents('o.total', CANCELED)} AS canceled_cents
       FROM orders o
       WHERE ((${SOLD}) OR (${CANCELED})) ${byAuthor}`,
      values,
    );
    return {
      revenue_cents: Number(row.revenue_cents),
      orders: Number(row.orders),
      canceled_orders: Number(row.canceled_orders),
      canceled_cents: Number(row.canceled_cents),
    };
  }

  public async revenueSeries(
    range: LocalRange,
    granularity: MetricsGranularity,
    filter: IMetricsFilter,
  ): Promise<IRevenuePoint[]> {
    // $4 = granularidade ('day' | 'week' | 'month'); semana começa na segunda
    const { values, byAuthor } = this.params(range, filter, [granularity]);
    const rows = await this.dataSource.query<
      { bucket: string; revenue_cents: string; orders: string }[]
    >(
      `WITH buckets AS (
         SELECT generate_series(
           date_trunc($4, $1::date::timestamp),
           date_trunc($4, $2::date::timestamp),
           ('1 ' || $4)::interval
         )::date AS bucket
       ),
       sales AS (
         SELECT date_trunc($4, o.paid_at AT TIME ZONE $3)::date AS bucket,
                SUM(o.total) AS total, COUNT(*) AS orders
         FROM orders o
         WHERE ${SOLD} ${byAuthor}
         GROUP BY 1
       )
       SELECT to_char(b.bucket, 'YYYY-MM-DD') AS bucket,
              COALESCE(ROUND(s.total * 100), 0)::bigint AS revenue_cents,
              COALESCE(s.orders, 0)::int AS orders
       FROM buckets b LEFT JOIN sales s ON s.bucket = b.bucket
       ORDER BY b.bucket`,
      values,
    );
    return rows.map(row => ({
      bucket: row.bucket,
      revenue_cents: Number(row.revenue_cents),
      orders: Number(row.orders),
    }));
  }

  public async topProducts(
    range: LocalRange,
    limit: number,
    filter: IMetricsFilter,
  ): Promise<ITopProduct[]> {
    const { values, byAuthor } = this.params(range, filter, [limit]);
    const rows = await this.dataSource.query<
      { id: string; name: string; units: string; revenue_cents: string }[]
    >(
      `SELECT p.id, p.name,
              SUM(i.quantity)::int AS units,
              ROUND(SUM(i.price * i.quantity) * 100)::bigint AS revenue_cents
       FROM orders o
       JOIN order_items i ON i.order_id = o.id
       JOIN products p ON p.id = i.product_id
       WHERE ${SOLD} ${byAuthor}
       GROUP BY p.id, p.name
       ORDER BY revenue_cents DESC, p.name, p.id
       LIMIT $4`,
      values,
    );
    return rows.map(row => ({
      product: { id: row.id, name: row.name },
      units: Number(row.units),
      revenue_cents: Number(row.revenue_cents),
    }));
  }

  public async topCustomers(
    range: LocalRange,
    limit: number,
    filter: IMetricsFilter,
  ): Promise<ITopCustomer[]> {
    const { values, byAuthor } = this.params(range, filter, [limit]);
    const rows = await this.dataSource.query<
      {
        id: string;
        name: string;
        email: string;
        orders: string;
        revenue_cents: string;
      }[]
    >(
      `SELECT c.id, c.name, c.email,
              COUNT(*)::int AS orders,
              ROUND(SUM(o.total) * 100)::bigint AS revenue_cents
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE ${SOLD} ${byAuthor}
       GROUP BY c.id, c.name, c.email
       ORDER BY revenue_cents DESC, c.name, c.id
       LIMIT $4`,
      values,
    );
    return rows.map(row => ({
      customer: { id: row.id, name: row.name, email: row.email },
      orders: Number(row.orders),
      revenue_cents: Number(row.revenue_cents),
    }));
  }

  public async salesByCategory(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<ICategorySales[]> {
    const { values, byAuthor } = this.params(range, filter);
    const rows = await this.dataSource.query<
      {
        id: string | null;
        name: string | null;
        units: string;
        revenue_cents: string;
      }[]
    >(
      // categoria ATUAL do produto; sem categoria vira uma linha com id nulo
      `SELECT c.id, c.name,
              SUM(i.quantity)::int AS units,
              ROUND(SUM(i.price * i.quantity) * 100)::bigint AS revenue_cents
       FROM orders o
       JOIN order_items i ON i.order_id = o.id
       JOIN products p ON p.id = i.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${SOLD} ${byAuthor}
       GROUP BY c.id, c.name
       ORDER BY revenue_cents DESC, c.name NULLS LAST`,
      values,
    );
    return rows.map(row => ({
      category: row.id ? { id: row.id, name: row.name ?? '' } : null,
      units: Number(row.units),
      revenue_cents: Number(row.revenue_cents),
    }));
  }

  public async ordersByStatus(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<IStatusCount[]> {
    const { values, byAuthor } = this.params(range, filter);
    const rows = await this.dataSource.query<
      { status: IStatusCount['status']; orders: string; total_cents: string }[]
    >(
      `SELECT o.status,
              COUNT(*)::int AS orders,
              ROUND(SUM(o.total) * 100)::bigint AS total_cents
       FROM orders o
       WHERE ${CREATED} ${byAuthor}
       GROUP BY o.status`,
      values,
    );
    return rows.map(row => ({
      status: row.status,
      orders: Number(row.orders),
      total_cents: Number(row.total_cents),
    }));
  }
}
