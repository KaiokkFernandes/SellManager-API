import { z } from 'zod';
import { moneyCentsSchema } from './common';
import { orderStatusSchema } from './orderWorkflow';
import { because } from './validation';

/**
 * Métricas de vendas. Definições (detalhes no README raiz):
 * - VENDA = pedido pago e não cancelado (paid, shipped, delivered), contado na
 *   data do PAGAMENTO (paid_at), no fuso do negócio (BUSINESS_TIMEZONE).
 * - CANCELADO = contado na data do cancelamento (canceled_at).
 * - Período anterior = mesmo tamanho, imediatamente antes (mês atual: o mesmo
 *   trecho do mês passado).
 */
export const METRICS_PRESETS = [
  'today',
  '7d',
  '30d',
  'month',
  'custom',
] as const;
export type MetricsPreset = (typeof METRICS_PRESETS)[number];

/** Período personalizado: no máximo 2 anos (a série diária fica limitada). */
export const MAX_METRICS_RANGE_DAYS = 731;

const localDate = z.iso.date().meta({ description: 'Dia local (AAAA-MM-DD)' });

const periodFields = z.object({
  preset: z.enum(METRICS_PRESETS).default('30d'),
  from: localDate.optional(),
  to: localDate.optional().meta({ description: 'Inclusivo' }),
});

const daysBetween = (from: string, to: string) =>
  (Date.parse(to) - Date.parse(from)) / 86_400_000;

/** Regras do período personalizado, aplicadas em toda query de métricas. */
function withPeriodRules<T extends typeof periodFields>(schema: T) {
  return schema
    .refine(
      ({ preset, from, to }) => preset !== 'custom' || Boolean(from && to),
      because('custom_range_required', 'from'),
    )
    .refine(
      ({ preset, from, to }) =>
        preset !== 'custom' || !from || !to || from <= to,
      because('inverted_range', 'to'),
    )
    .refine(
      ({ preset, from, to }) =>
        preset !== 'custom' ||
        !from ||
        !to ||
        daysBetween(from, to) < MAX_METRICS_RANGE_DAYS,
      because('range_too_long', 'to'),
    );
}

export const metricsPeriodQuerySchema = withPeriodRules(periodFields);
export type MetricsPeriodQuery = z.infer<typeof metricsPeriodQuerySchema>;

export const METRICS_GRANULARITIES = ['day', 'week', 'month'] as const;
export type MetricsGranularity = (typeof METRICS_GRANULARITIES)[number];

export const revenueQuerySchema = withPeriodRules(
  periodFields.extend({
    granularity: z.enum(METRICS_GRANULARITIES).optional().meta({
      description:
        'Padrão pelo tamanho do período: até 31 dias por dia, até 186 por semana, acima por mês',
    }),
  }),
);
export type RevenueQuery = z.infer<typeof revenueQuerySchema>;

export const topQuerySchema = withPeriodRules(
  periodFields.extend({
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
);
export type TopQuery = z.infer<typeof topQuerySchema>;

// ---- Respostas

const range = z.object({
  from: localDate,
  to: localDate.meta({ description: 'Inclusivo' }),
});

export const metricsPeriodSchema = z
  .object({
    preset: z.enum(METRICS_PRESETS),
    timezone: z.string().meta({ example: 'America/Sao_Paulo' }),
    current: range,
    previous: range,
  })
  .meta({ id: 'MetricsPeriod' });
export type MetricsPeriod = z.infer<typeof metricsPeriodSchema>;

/** all = loja inteira (report:read); own = só os pedidos que o usuário criou. */
export const metricsScopeSchema = z.enum(['all', 'own']);
export type MetricsScope = z.infer<typeof metricsScopeSchema>;

const salesFigures = z.object({
  revenue_cents: moneyCentsSchema,
  orders: z.number().int().describe('Vendas (pagas e não canceladas)'),
  average_ticket_cents: moneyCentsSchema,
  canceled_orders: z.number().int(),
  canceled_cents: moneyCentsSchema,
  cancel_rate: z
    .number()
    .min(0)
    .max(1)
    .describe('cancelados ÷ (vendas + cancelados); 0 sem pedidos'),
});
export type SalesFigures = z.infer<typeof salesFigures>;

const change = z
  .number()
  .nullable()
  .describe('Variação relativa (0.12 = +12%); null se o anterior é zero');

export const metricsSummarySchema = z
  .object({
    period: metricsPeriodSchema,
    scope: metricsScopeSchema,
    current: salesFigures,
    previous: salesFigures,
    change: z.object({
      revenue: change,
      orders: change,
      average_ticket: change,
      canceled_orders: change,
      cancel_rate: z.number().describe('Diferença em pontos (0.02 = +2 p.p.)'),
    }),
  })
  .meta({ id: 'MetricsSummary' });
export type MetricsSummary = z.infer<typeof metricsSummarySchema>;

export const revenueSeriesSchema = z
  .object({
    period: metricsPeriodSchema,
    scope: metricsScopeSchema,
    granularity: z.enum(METRICS_GRANULARITIES),
    points: z.array(
      z.object({
        bucket: localDate.describe('Início do dia, semana (segunda) ou mês'),
        revenue_cents: moneyCentsSchema,
        orders: z.number().int(),
      }),
    ),
  })
  .meta({ id: 'RevenueSeries' });
export type RevenueSeries = z.infer<typeof revenueSeriesSchema>;

export const topProductsSchema = z
  .object({
    period: metricsPeriodSchema,
    scope: metricsScopeSchema,
    items: z.array(
      z.object({
        product: z.object({ id: z.uuid(), name: z.string() }),
        units: z.number().int(),
        revenue_cents: moneyCentsSchema,
      }),
    ),
  })
  .meta({ id: 'TopProducts' });
export type TopProducts = z.infer<typeof topProductsSchema>;

export const topCustomersSchema = z
  .object({
    period: metricsPeriodSchema,
    scope: metricsScopeSchema,
    items: z.array(
      z.object({
        customer: z.object({
          id: z.uuid(),
          name: z.string(),
          email: z.email(),
        }),
        orders: z.number().int(),
        revenue_cents: moneyCentsSchema,
      }),
    ),
  })
  .meta({ id: 'TopCustomers' });
export type TopCustomers = z.infer<typeof topCustomersSchema>;

export const salesByCategorySchema = z
  .object({
    period: metricsPeriodSchema,
    scope: metricsScopeSchema,
    items: z.array(
      z.object({
        category: z
          .object({ id: z.uuid(), name: z.string() })
          .nullable()
          .describe('null = sem categoria (categoria atual do produto)'),
        units: z.number().int(),
        revenue_cents: moneyCentsSchema,
      }),
    ),
  })
  .meta({ id: 'SalesByCategory' });
export type SalesByCategory = z.infer<typeof salesByCategorySchema>;

export const ordersByStatusSchema = z
  .object({
    period: metricsPeriodSchema,
    scope: metricsScopeSchema,
    items: z.array(
      z.object({
        status: orderStatusSchema,
        orders: z
          .number()
          .int()
          .describe('Criados no período, pelo status atual'),
        total_cents: moneyCentsSchema,
      }),
    ),
  })
  .meta({ id: 'OrdersByStatus' });
export type OrdersByStatus = z.infer<typeof ordersByStatusSchema>;
