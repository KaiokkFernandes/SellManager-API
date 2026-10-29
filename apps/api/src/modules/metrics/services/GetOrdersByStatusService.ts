import {
  ORDER_STATUSES,
  type MetricsPeriodQuery,
  type OrdersByStatus,
} from '@sellmanager/shared';
import { IMetricsViewer, metricsContext } from '../domain/context';
import { IMetricsRepository } from '../domain/repositories/IMetricsRepository';

/** Funil: pedidos criados no período por status atual, com zeros. */
export class GetOrdersByStatusService {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly timezone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async execute(
    query: MetricsPeriodQuery,
    viewer: IMetricsViewer,
  ): Promise<OrdersByStatus> {
    const { period, scope, filter } = metricsContext(
      query,
      viewer,
      this.timezone,
      this.now(),
    );
    const counts = await this.metricsRepository.ordersByStatus(
      period.current,
      filter,
    );
    // todos os status, na ordem da máquina de estados
    const items = ORDER_STATUSES.map(
      status =>
        counts.find(count => count.status === status) ?? {
          status,
          orders: 0,
          total_cents: 0,
        },
    );
    return { period, scope, items };
  }
}
