import { z } from 'zod';
import { periodFields, withPeriodRules } from './metrics';

/**
 * Relatórios exportáveis (CSV para Excel em pt-BR: UTF-8 com BOM, separador
 * ";", vírgula decimal, datas dd/mm/aaaa no fuso do negócio). Mesmo período
 * das métricas; venda = pago e não cancelado, pela data do pagamento.
 */
export const REPORTS = ['sales', 'products', 'customers'] as const;
export type ReportName = (typeof REPORTS)[number];

/** Status que contam como venda (filtro do relatório de vendas). */
export const SALE_STATUSES = ['paid', 'shipped', 'delivered'] as const;

export const salesReportQuerySchema = withPeriodRules(
  periodFields.extend({
    status: z.enum(SALE_STATUSES).optional(),
    customer_id: z.uuid().optional(),
  }),
);
export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;

export const productsReportQuerySchema = withPeriodRules(
  periodFields.extend({
    category_id: z.uuid().optional(),
    below_min_stock: z
      .stringbool()
      .optional()
      .meta({ description: 'Só os abaixo do estoque mínimo' }),
  }),
);
export type ProductsReportQuery = z.infer<typeof productsReportQuerySchema>;

export const customersReportQuerySchema = withPeriodRules(
  periodFields.extend({
    only_buyers: z
      .stringbool()
      .default(true)
      .meta({ description: 'Só quem comprou no período (padrão)' }),
  }),
);
export type CustomersReportQuery = z.infer<typeof customersReportQuerySchema>;
