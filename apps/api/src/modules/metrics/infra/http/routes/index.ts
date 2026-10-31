import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { GetMetricsSummaryService } from '../../../services/GetMetricsSummaryService';
import { GetOrdersByStatusService } from '../../../services/GetOrdersByStatusService';
import { GetRevenueSeriesService } from '../../../services/GetRevenueSeriesService';
import { GetSalesByCategoryService } from '../../../services/GetSalesByCategoryService';
import { GetTopCustomersService } from '../../../services/GetTopCustomersService';
import { GetTopProductsService } from '../../../services/GetTopProductsService';
import { MetricsController } from '../controllers/MetricsController';

export function registerMetricsRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { metrics } = container.repositories;
  const timezone = container.config.BUSINESS_TIMEZONE;

  const controller = new MetricsController({
    summary: new GetMetricsSummaryService(metrics, timezone),
    revenue: new GetRevenueSeriesService(metrics, timezone),
    topProducts: new GetTopProductsService(metrics, timezone),
    topCustomers: new GetTopCustomersService(metrics, timezone),
    categories: new GetSalesByCategoryService(metrics, timezone),
    status: new GetOrdersByStatusService(metrics, timezone),
  });

  mount(routes.metrics.summary, controller.summary);
  mount(routes.metrics.revenue, controller.revenue);
  mount(routes.metrics.topProducts, controller.topProducts);
  mount(routes.metrics.topCustomers, controller.topCustomers);
  mount(routes.metrics.categories, controller.categories);
  mount(routes.metrics.status, controller.status);
}
