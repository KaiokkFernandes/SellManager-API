import type { OrderStatus } from '@sellmanager/shared';
import { CsvColumn } from './csv';
import {
  ICustomersReportRow,
  IProductsReportRow,
  ISalesReportRow,
} from './repositories/IReportsRepository';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  canceled: 'Cancelado',
};

/** Cabeçalhos em pt-BR: quem abre é a pessoa, no Excel. */
export const SALES_COLUMNS: readonly CsvColumn<ISalesReportRow>[] = [
  { header: 'Pedido', kind: 'text', value: row => row.id.slice(0, 8) },
  { header: 'Data do pagamento', kind: 'datetime', value: row => row.paid_at },
  { header: 'Cliente', kind: 'text', value: row => row.customer_name },
  { header: 'E-mail', kind: 'text', value: row => row.customer_email },
  { header: 'Status', kind: 'text', value: row => STATUS_LABELS[row.status] },
  { header: 'Itens', kind: 'int', value: row => row.items },
  { header: 'Total (R$)', kind: 'money', value: row => row.total_cents },
  { header: 'Criado por', kind: 'text', value: row => row.created_by },
  { header: 'ID do pedido', kind: 'text', value: row => row.id },
];

export const PRODUCTS_COLUMNS: readonly CsvColumn<IProductsReportRow>[] = [
  { header: 'Produto', kind: 'text', value: row => row.name },
  { header: 'Categoria', kind: 'text', value: row => row.category },
  { header: 'Preço (R$)', kind: 'money', value: row => row.price_cents },
  { header: 'Estoque', kind: 'int', value: row => row.quantity },
  { header: 'Estoque mínimo', kind: 'int', value: row => row.min_stock },
  {
    header: 'Abaixo do mínimo',
    kind: 'text',
    value: row => (row.quantity < row.min_stock ? 'Sim' : 'Não'),
  },
  {
    header: 'Unidades vendidas no período',
    kind: 'int',
    value: row => row.units_sold,
  },
  {
    header: 'Faturamento no período (R$)',
    kind: 'money',
    value: row => row.revenue_cents,
  },
];

export const CUSTOMERS_COLUMNS: readonly CsvColumn<ICustomersReportRow>[] = [
  { header: 'Cliente', kind: 'text', value: row => row.name },
  { header: 'E-mail', kind: 'text', value: row => row.email },
  { header: 'Pedidos no período', kind: 'int', value: row => row.orders },
  {
    header: 'Total comprado no período (R$)',
    kind: 'money',
    value: row => row.total_cents,
  },
  {
    header: 'Última compra no período',
    kind: 'datetime',
    value: row => row.last_purchase,
  },
];
