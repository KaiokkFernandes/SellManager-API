import type {
  CustomersReportQuery,
  ProductsReportQuery,
  SalesReportQuery,
} from '@sellmanager/shared';
import { resolvePeriod } from '@modules/metrics/domain/period';
import {
  CUSTOMERS_COLUMNS,
  PRODUCTS_COLUMNS,
  SALES_COLUMNS,
} from '../domain/columns';
import { reportFilename, toCsv } from '../domain/csv';
import { IReportsRepository } from '../domain/repositories/IReportsRepository';

export interface IReportFile {
  filename: string;
  content: AsyncIterable<string>;
}

/** Os três relatórios CSV, no mesmo período das métricas. */
export class ExportReportService {
  constructor(
    private readonly reportsRepository: IReportsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private period(query: SalesReportQuery | ProductsReportQuery) {
    const { current } = resolvePeriod(query, this.timezone, this.now());
    return { range: current, timezone: this.timezone };
  }

  public sales({
    status,
    customer_id,
    ...query
  }: SalesReportQuery): IReportFile {
    const period = this.period(query);
    return {
      filename: reportFilename('vendas', period.range),
      content: toCsv(
        SALES_COLUMNS,
        this.reportsRepository.sales(period, {
          status,
          customerId: customer_id,
        }),
        this.timezone,
      ),
    };
  }

  public products({
    category_id,
    below_min_stock,
    ...query
  }: ProductsReportQuery): IReportFile {
    const period = this.period(query);
    return {
      filename: reportFilename('produtos', period.range),
      content: toCsv(
        PRODUCTS_COLUMNS,
        this.reportsRepository.products(period, {
          categoryId: category_id,
          belowMinStock: below_min_stock,
        }),
        this.timezone,
      ),
    };
  }

  public customers({
    only_buyers,
    ...query
  }: CustomersReportQuery): IReportFile {
    const period = this.period(query);
    return {
      filename: reportFilename('clientes', period.range),
      content: toCsv(
        CUSTOMERS_COLUMNS,
        this.reportsRepository.customers(period, { onlyBuyers: only_buyers }),
        this.timezone,
      ),
    };
  }
}
