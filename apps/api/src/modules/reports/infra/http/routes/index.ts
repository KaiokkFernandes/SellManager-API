import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { ExportReportService } from '../../../services/ExportReportService';
import { ReportsController } from '../controllers/ReportsController';

export function registerReportsRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const controller = new ReportsController(
    new ExportReportService(
      container.repositories.reports,
      container.config.BUSINESS_TIMEZONE,
    ),
  );

  mount(routes.reports.sales, controller.sales);
  mount(routes.reports.products, controller.products);
  mount(routes.reports.customers, controller.customers);
}
