import { DataSource } from 'typeorm';
import { RawSalesFigures } from '../../domain/figures';
import { LocalRange } from '../../domain/period';
import {
  IMetricsFilter,
  IMetricsRepository,
} from '../../domain/repositories/IMetricsRepository';

/**
 * Parâmetros comuns: $1 = início (dia local), $2 = fim (dia local, inclusivo),
 * $3 = fuso. Os limites viram instantes no banco (`AT TIME ZONE` trata o
 * horário de verão), então a comparação usa os índices de paid_at/canceled_at.
 */
const START = `(($1::date)::timestamp AT TIME ZONE $3)`;
const END = `((($2::date) + 1)::timestamp AT TIME ZONE $3)`;
const SOLD = `o.status <> 'canceled' AND o.paid_at >= ${START} AND o.paid_at < ${END}`;
const CANCELED = `o.canceled_at >= ${START} AND o.canceled_at < ${END}`;

/** Soma de decimal em reais -> centavos inteiros, no banco. */
const cents = (expression: string, where = 'TRUE') =>
  `COALESCE(ROUND(SUM(${expression}) FILTER (WHERE ${where}) * 100), 0)::bigint`;

export class MetricsRepository implements IMetricsRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** Filtro de autor como SQL extra ($4) só quando há escopo "own". */
  private scoped(
    { from, to }: LocalRange,
    { timezone, createdBy }: IMetricsFilter,
  ): { params: unknown[]; byAuthor: string } {
    return createdBy
      ? {
          params: [from, to, timezone, createdBy],
          byAuthor: 'AND o.created_by = $4',
        }
      : { params: [from, to, timezone], byAuthor: '' };
  }

  public async salesFigures(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<RawSalesFigures> {
    const { params, byAuthor } = this.scoped(range, filter);
    const [row] = await this.dataSource.query<
      [Record<keyof RawSalesFigures, string>]
    >(
      `SELECT
         ${cents('o.total', SOLD)} AS revenue_cents,
         COUNT(*) FILTER (WHERE ${SOLD})::int AS orders,
         COUNT(*) FILTER (WHERE ${CANCELED})::int AS canceled_orders,
         ${cents('o.total', CANCELED)} AS canceled_cents
       FROM orders o
       WHERE ((${SOLD}) OR (${CANCELED})) ${byAuthor}`,
      params,
    );
    return {
      revenue_cents: Number(row.revenue_cents),
      orders: Number(row.orders),
      canceled_orders: Number(row.canceled_orders),
      canceled_cents: Number(row.canceled_cents),
    };
  }
}
