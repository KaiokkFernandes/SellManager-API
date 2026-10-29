import { DataSource } from 'typeorm';
import { SOLD } from '@modules/metrics/infra/typeorm/salesSql';
import { streamRows } from '@shared/infra/typeorm/cursor';
import {
  ICustomersReportRow,
  IProductsReportRow,
  IReportPeriod,
  IReportsRepository,
  ISalesReportRow,
} from '../../domain/repositories/IReportsRepository';

/** $1/$2 = dias locais do período, $3 = fuso (mesma convenção das métricas). */
function base({ range, timezone }: IReportPeriod): unknown[] {
  return [range.from, range.to, timezone];
}

/** Acrescenta um parâmetro e devolve o placeholder dele ($4, $5…). */
function param(values: unknown[], value: unknown): string {
  values.push(value);
  return `$${values.length}`;
}

export class ReportsRepository implements IReportsRepository {
  constructor(private readonly dataSource: DataSource) {}

  public async *sales(
    period: IReportPeriod,
    { status, customerId }: { status?: string; customerId?: string },
  ): AsyncIterable<ISalesReportRow> {
    const values = base(period);
    const filters = [
      status ? `AND o.status = ${param(values, status)}` : '',
      customerId ? `AND o.customer_id = ${param(values, customerId)}` : '',
    ].join(' ');
    type Raw = Omit<ISalesReportRow, 'items' | 'total_cents'> & {
      items: string;
      total_cents: string;
    };
    for await (const row of streamRows<Raw>(
      this.dataSource,
      `SELECT o.id, o.paid_at, c.name AS customer_name, c.email AS customer_email,
              o.status,
              (SELECT COALESCE(SUM(i.quantity), 0) FROM order_items i WHERE i.order_id = o.id) AS items,
              ROUND(o.total * 100)::bigint AS total_cents,
              u.name AS created_by
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN users u ON u.id = o.created_by
       WHERE ${SOLD} ${filters}
       ORDER BY o.paid_at, o.id`,
      values,
    )) {
      yield {
        ...row,
        items: Number(row.items),
        total_cents: Number(row.total_cents),
      };
    }
  }

  public async *products(
    period: IReportPeriod,
    {
      categoryId,
      belowMinStock,
    }: { categoryId?: string; belowMinStock?: boolean },
  ): AsyncIterable<IProductsReportRow> {
    const values = base(period);
    const filters = [
      categoryId ? `AND p.category_id = ${param(values, categoryId)}` : '',
      belowMinStock ? 'AND p.quantity < p.min_stock' : '',
    ].join(' ');
    type Raw = Record<keyof IProductsReportRow, string | null>;
    for await (const row of streamRows<Raw>(
      this.dataSource,
      `WITH sold AS (
         SELECT i.product_id, SUM(i.quantity) AS units,
                SUM(i.price * i.quantity) AS revenue
         FROM orders o JOIN order_items i ON i.order_id = o.id
         WHERE ${SOLD}
         GROUP BY i.product_id
       )
       SELECT p.name, cat.name AS category,
              ROUND(p.price * 100)::bigint AS price_cents,
              p.quantity, p.min_stock,
              COALESCE(s.units, 0)::int AS units_sold,
              ROUND(COALESCE(s.revenue, 0) * 100)::bigint AS revenue_cents
       FROM products p
       LEFT JOIN categories cat ON cat.id = p.category_id
       LEFT JOIN sold s ON s.product_id = p.id
       WHERE TRUE ${filters}
       ORDER BY lower(p.name), p.id`,
      values,
    )) {
      yield {
        name: row.name ?? '',
        category: row.category,
        price_cents: Number(row.price_cents),
        quantity: Number(row.quantity),
        min_stock: Number(row.min_stock),
        units_sold: Number(row.units_sold),
        revenue_cents: Number(row.revenue_cents),
      };
    }
  }

  public async *customers(
    period: IReportPeriod,
    { onlyBuyers }: { onlyBuyers: boolean },
  ): AsyncIterable<ICustomersReportRow> {
    type Raw = Omit<ICustomersReportRow, 'orders' | 'total_cents'> & {
      orders: string;
      total_cents: string;
    };
    for await (const row of streamRows<Raw>(
      this.dataSource,
      `WITH bought AS (
         SELECT o.customer_id, COUNT(*) AS orders, SUM(o.total) AS total,
                MAX(o.paid_at) AS last_purchase
         FROM orders o
         WHERE ${SOLD}
         GROUP BY o.customer_id
       )
       SELECT c.name, c.email,
              COALESCE(b.orders, 0)::int AS orders,
              ROUND(COALESCE(b.total, 0) * 100)::bigint AS total_cents,
              b.last_purchase
       FROM customers c
       ${onlyBuyers ? 'JOIN' : 'LEFT JOIN'} bought b ON b.customer_id = c.id
       ORDER BY total_cents DESC, lower(c.name), c.id`,
      base(period),
    )) {
      yield {
        ...row,
        orders: Number(row.orders),
        total_cents: Number(row.total_cents),
      };
    }
  }
}
