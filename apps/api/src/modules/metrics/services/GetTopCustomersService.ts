import type { TopCustomers, TopQuery } from '@sellmanager/shared';
import { IMetricsViewer, metricsContext } from '../domain/context';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

/** Clientes com mais faturamento nas vendas do período. */
export class GetTopCustomersService {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async execute(
    { limit, ...query }: TopQuery,
    viewer: IMetricsViewer,
  ): Promise<TopCustomers> {
    const { period, scope, filter } = metricsContext(
      query,
      viewer,
      this.timezone,
      this.now(),
    );
    const items = await this.metricsRepository.topCustomers(
      period.current,
      limit,
      filter,
    );
    return { period, scope, items };
  }
}
