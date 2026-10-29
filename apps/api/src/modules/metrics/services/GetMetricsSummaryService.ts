import type {
  MetricsPeriodQuery,
  MetricsSummary,
  Role,
} from '@sellmanager/shared';
import {
  compareFigures,
  metricsScope,
  toSalesFigures,
} from '../domain/figures';
import { resolvePeriod } from '../domain/period';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

export interface IMetricsViewer {
  id: string;
  role: Role;
}

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
    const period = resolvePeriod(query, this.timezone, this.now());
    const scope = metricsScope(viewer.role);
    const filter = {
      timezone: this.timezone,
      createdBy: scope === 'own' ? viewer.id : undefined,
    };

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
