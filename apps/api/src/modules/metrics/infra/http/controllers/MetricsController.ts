import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { GetMetricsSummaryService } from '../../../services/GetMetricsSummaryService';

interface MetricsServices {
  summary: GetMetricsSummaryService;
}

type Routes = typeof routes.metrics;

export class MetricsController {
  constructor(private readonly services: MetricsServices) {}

  public summary: RouteHandler<Routes['summary']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(200, await this.services.summary.execute(input.query, request.user));
  };
}
