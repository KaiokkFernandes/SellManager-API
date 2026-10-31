import type { RevenueQuery, RevenueSeries } from '@sellmanager/shared';
import { IMetricsViewer, metricsContext } from '../domain/context';
import { defaultGranularity } from '../domain/period';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

/** Faturamento no tempo; granularidade pelo tamanho do período se não vier. */
export class GetRevenueSeriesService {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async execute(
    { granularity, ...query }: RevenueQuery,
    viewer: IMetricsViewer,
  ): Promise<RevenueSeries> {
    const { period, scope, filter } = metricsContext(
      query,
      viewer,
      this.timezone,
      this.now(),
    );
    const resolved = granularity ?? defaultGranularity(period.current);
    const points = await this.metricsRepository.revenueSeries(
      period.current,
      resolved,
      filter,
    );
    return { period, scope, granularity: resolved, points };
  }
}
