import type { TopProducts, TopQuery } from '@sellmanager/shared';
import { IMetricsViewer, metricsContext } from '../domain/context';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

/** Produtos com mais faturamento nas vendas do período (preço da compra). */
export class GetTopProductsService {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async execute(
    { limit, ...query }: TopQuery,
    viewer: IMetricsViewer,
  ): Promise<TopProducts> {
    const { period, scope, filter } = metricsContext(
      query,
      viewer,
      this.timezone,
      this.now(),
    );
    const items = await this.metricsRepository.topProducts(
      period.current,
      limit,
      filter,
    );
    return { period, scope, items };
  }
}
