import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { GetMetricsSummaryService } from '../../../services/GetMetricsSummaryService';
import { MetricsController } from '../controllers/MetricsController';

export function registerMetricsRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { metrics } = container.repositories;
  const timezone = container.config.BUSINESS_TIMEZONE;

  const controller = new MetricsController({
    summary: new GetMetricsSummaryService(metrics, timezone),
  });

  mount(routes.metrics.summary, controller.summary);
}
