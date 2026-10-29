import { METRICS_PRESETS } from '@sellmanager/shared';
import { z } from 'zod';

const day = z.iso.date().optional().catch(undefined);

/** Período do dashboard na URL: ?preset=30d ou ?preset=custom&from=&to= */
export const dashboardSearchSchema = z.object({
  preset: z.enum(METRICS_PRESETS).optional().catch(undefined),
  from: day,
  to: day,
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

/** Query das métricas: personalizado só vale com as duas datas. */
export function toPeriodQuery({ preset, from, to }: DashboardSearch) {
  if (preset === 'custom' && from && to && from <= to)
    return { preset, from, to } as const;
  return { preset: preset && preset !== 'custom' ? preset : '30d' } as const;
}

export type PeriodQuery = ReturnType<typeof toPeriodQuery>;
