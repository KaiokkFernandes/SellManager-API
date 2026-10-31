import type {
  MetricsGranularity,
  MetricsPeriodQuery,
  MetricsPreset,
} from '@sellmanager/shared';

/** Intervalo de dias locais, inclusivo (AAAA-MM-DD). */
export interface LocalRange {
  from: string;
  to: string;
}

export interface ResolvedPeriod {
  preset: MetricsPreset;
  timezone: string;
  current: LocalRange;
  previous: LocalRange;
}

const DAY_MS = 86_400_000;

// datas locais como meia-noite UTC: aritmética de dias sem fuso no meio
function parse(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function format(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return format(parse(date) + days * DAY_MS);
}

/** Quantos dias o intervalo tem (inclusivo). */
export function rangeDays({ from, to }: LocalRange): number {
  return Math.round((parse(to) - parse(from)) / DAY_MS) + 1;
}

/** "Hoje" no fuso do negócio (23:30 de 31/10 em São Paulo ainda é 31/10). */
export function todayIn(timezone: string, now: Date): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Mesmo tamanho, imediatamente antes. */
function precedingRange(range: LocalRange): LocalRange {
  const days = rangeDays(range);
  return { from: addDays(range.from, -days), to: addDays(range.from, -1) };
}

/**
 * Resolve o preset em dias locais e o período de comparação:
 * - today / 7d / 30d: terminam hoje (inclusive); anterior = mesmo tamanho antes
 * - month: do dia 1 até hoje; anterior = o mesmo trecho do mês passado (dia
 *   limitado ao último do mês: 31/03 compara com até 28 ou 29/02)
 * - custom: from..to informados; anterior = mesmo tamanho antes
 */
export function resolvePeriod(
  { preset, from, to }: MetricsPeriodQuery,
  timezone: string,
  now: Date,
): ResolvedPeriod {
  const today = todayIn(timezone, now);

  let current: LocalRange;
  let previous: LocalRange;
  switch (preset) {
    case 'today':
      current = { from: today, to: today };
      previous = precedingRange(current);
      break;
    case '7d':
    case '30d': {
      const days = preset === '7d' ? 7 : 30;
      current = { from: addDays(today, -(days - 1)), to: today };
      previous = precedingRange(current);
      break;
    }
    case 'month': {
      const [year, month, day] = today.split('-').map(Number) as [
        number,
        number,
        number,
      ];
      current = { from: `${today.slice(0, 7)}-01`, to: today };
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonth = month === 1 ? 11 : month - 2; // 0-based
      const prevDay = Math.min(day, lastDayOfMonth(prevYear, prevMonth));
      const prefix = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
      previous = {
        from: `${prefix}-01`,
        to: `${prefix}-${String(prevDay).padStart(2, '0')}`,
      };
      break;
    }
    case 'custom':
      // o schema do shared já garantiu from/to presentes e em ordem
      current = { from: from ?? today, to: to ?? today };
      previous = precedingRange(current);
      break;
  }

  return { preset, timezone, current, previous };
}

/** Granularidade padrão da série pelo tamanho do período. */
export function defaultGranularity(range: LocalRange): MetricsGranularity {
  const days = rangeDays(range);
  if (days <= 31) return 'day';
  if (days <= 186) return 'week';
  return 'month';
}
