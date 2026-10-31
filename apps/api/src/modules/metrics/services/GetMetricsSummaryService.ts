import type { MetricsPeriodQuery, MetricsSummary } from '@sellmanager/shared';
import { IMetricsViewer, metricsContext } from '../domain/context';
import { compareFigures, toSalesFigures } from '../domain/figures';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

export class GetMetricsSummaryService {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async execute(
    query: MetricsPeriodQuery,
    viewer: IMetricsViewer,
  ): Promise<MetricsSummary> {
    const { period, scope, filter } = metricsContext(
      query,
      viewer,
      this.timezone,
      this.now(),
    );

    const [current, previous] = await Promise.all([
      this.metricsRepository.salesFigures(period.current, filter),
      this.metricsRepository.salesFigures(period.previous, filter),
    ]);
    const currentFigures = toSalesFigures(current);
    const previousFigures = toSalesFigures(previous);

    return {
      period,
      scope,
      current: currentFigures,
      previous: previousFigures,
      change: compareFigures(currentFigures, previousFigures),
    };
  }
}
