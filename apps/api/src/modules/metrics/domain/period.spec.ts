import { describe, expect, it } from 'vitest';
import {
  defaultGranularity,
  rangeDays,
  resolvePeriod,
  todayIn,
} from './period';

const TZ = 'America/Sao_Paulo';
// 29/10/2026 15:00 em São Paulo (UTC−3)
const NOW = new Date('2026-10-29T18:00:00Z');

describe('período das métricas', () => {
  it('"hoje" é o dia local do negócio, não o de UTC', () => {
    // 31/10 23:30 em SP = 01/11 02:30 UTC
    expect(todayIn(TZ, new Date('2026-11-01T02:30:00Z'))).toBe('2026-10-31');
    expect(todayIn('UTC', new Date('2026-11-01T02:30:00Z'))).toBe('2026-11-01');
  });

  it.each([
    ['today', '2026-10-29', '2026-10-29', '2026-10-28', '2026-10-28'],
    ['7d', '2026-10-23', '2026-10-29', '2026-10-16', '2026-10-22'],
    ['30d', '2026-09-30', '2026-10-29', '2026-08-31', '2026-09-29'],
    ['month', '2026-10-01', '2026-10-29', '2026-09-01', '2026-09-29'],
  ] as const)(
    '%s: %s a %s, anterior %s a %s',
    (preset, from, to, pFrom, pTo) => {
      expect(resolvePeriod({ preset }, TZ, NOW)).toEqual({
        preset,
        timezone: TZ,
        current: { from, to },
        previous: { from: pFrom, to: pTo },
      });
    },
  );

  it('mês atual no dia 31 compara com o último dia do mês anterior', () => {
    const march31 = new Date('2026-03-31T15:00:00Z');
    expect(resolvePeriod({ preset: 'month' }, TZ, march31).previous).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    const january = new Date('2026-01-15T15:00:00Z');
    expect(resolvePeriod({ preset: 'month' }, TZ, january).previous).toEqual({
      from: '2025-12-01',
      to: '2025-12-15',
    });
  });

  it('personalizado: anterior com o mesmo tamanho, imediatamente antes', () => {
    const period = resolvePeriod(
      { preset: 'custom', from: '2026-10-01', to: '2026-10-31' },
      TZ,
      NOW,
    );
    expect(period.previous).toEqual({ from: '2026-08-31', to: '2026-09-30' });
    expect(rangeDays(period.previous)).toBe(rangeDays(period.current));
  });

  it.each([
    [1, 'day'],
    [31, 'day'],
    [32, 'week'],
    [186, 'week'],
    [187, 'month'],
  ] as const)('%d dias: série por %s', (days, granularity) => {
    const to = new Date(Date.UTC(2026, 0, days)).toISOString().slice(0, 10);
    expect(defaultGranularity({ from: '2026-01-01', to })).toBe(granularity);
  });
});
