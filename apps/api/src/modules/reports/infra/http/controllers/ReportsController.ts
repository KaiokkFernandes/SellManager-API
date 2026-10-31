import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { ExportReportService } from '../../../services/ExportReportService';

type Routes = typeof routes.reports;

export class ReportsController {
  constructor(private readonly exportReport: ExportReportService) {}

  public sales: RouteHandler<Routes['sales']> = ({ input, download }) =>
    download(this.exportReport.sales(input.query));

  public products: RouteHandler<Routes['products']> = ({ input, download }) =>
    download(this.exportReport.products(input.query));

  public customers: RouteHandler<Routes['customers']> = ({ input, download }) =>
    download(this.exportReport.customers(input.query));
}
