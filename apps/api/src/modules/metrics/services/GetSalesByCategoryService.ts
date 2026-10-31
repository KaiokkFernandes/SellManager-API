import type { MetricsPeriodQuery, SalesByCategory } from '@sellmanager/shared';
import { IMetricsViewer, metricsContext } from '../domain/context';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

/** Faturamento por categoria atual do produto (null = sem categoria). */
export class GetSalesByCategoryService {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async execute(
    query: MetricsPeriodQuery,
    viewer: IMetricsViewer,
  ): Promise<SalesByCategory> {
    const { period, scope, filter } = metricsContext(
      query,
      viewer,
      this.timezone,
      this.now(),
    );
    const items = await this.metricsRepository.salesByCategory(
      period.current,
      filter,
    );
    return { period, scope, items };
  }
}
