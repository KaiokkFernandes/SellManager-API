/**
 * Definição ÚNICA de venda em SQL (métricas e relatórios usam a mesma).
 */
/**
 * Parâmetros comuns: $1 = início (dia local), $2 = fim (dia local, inclusivo),
 * $3 = fuso. Os limites viram instantes no banco (`AT TIME ZONE` trata o
 * horário de verão), então a comparação usa os índices de paid_at/canceled_at.
 */
export const START = `(($1::date)::timestamp AT TIME ZONE $3)`;
export const END = `((($2::date) + 1)::timestamp AT TIME ZONE $3)`;
/** Venda: paga e não cancelada, com o pagamento no período. */
export const SOLD = `o.status <> 'canceled' AND o.paid_at >= ${START} AND o.paid_at < ${END}`;
export const CANCELED = `o.canceled_at >= ${START} AND o.canceled_at < ${END}`;
export const CREATED = `o.created_at >= ${START} AND o.created_at < ${END}`;

/** Soma de decimal em reais -> centavos inteiros, no banco. */
export const cents = (expression: string, where = 'TRUE') =>
  `COALESCE(ROUND(SUM(${expression}) FILTER (WHERE ${where}) * 100), 0)::bigint`;
