import { METRICS_PRESETS } from '@sellmanager/shared';
import { z } from 'zod';

const day = z.iso.date().optional().catch(undefined);

/** Período na URL: ?preset=30d ou ?preset=custom&from=&to= (dashboard e relatórios). */
export const periodSearchSchema = z.object({
  preset: z.enum(METRICS_PRESETS).optional().catch(undefined),
  from: day,
  to: day,
});

export type PeriodSearch = z.infer<typeof periodSearchSchema>;

/** Query da API: personalizado só vale com as duas datas, em ordem. */
export function toPeriodQuery({ preset, from, to }: PeriodSearch) {
  if (preset === 'custom' && from && to && from <= to)
    return { preset, from, to } as const;
  return { preset: preset && preset !== 'custom' ? preset : '30d' } as const;
}

export type PeriodQuery = ReturnType<typeof toPeriodQuery>;
