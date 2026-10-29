import type {
  MetricsPeriodQuery,
  MetricsScope,
  Role,
} from '@sellmanager/shared';
import { metricsScope } from './figures';
import { resolvePeriod, ResolvedPeriod } from './period';
import { IMetricsFilter } from './repositories/IMetricsRepository';

export interface IMetricsViewer {
  id: string;
  role: Role;
}

export interface MetricsContext {
  period: ResolvedPeriod;
  scope: MetricsScope;
  filter: IMetricsFilter;
}

/** Período resolvido + alcance do usuário + filtro do repositório. */
export function metricsContext(
  query: MetricsPeriodQuery,
  viewer: IMetricsViewer,
  timezone: string,
  now: Date,
): MetricsContext {
  const scope = metricsScope(viewer.role);
  return {
    period: resolvePeriod(query, timezone, now),
    scope,
    filter: { timezone, createdBy: scope === 'own' ? viewer.id : undefined },
  };
}
