import { describe, expect, it } from 'vitest';
import { startOfLocalDay, startOfNextLocalDay } from './dates';

describe('dates', () => {
  it('converte o dia local em instantes [início, início do dia seguinte)', () => {
    const from = new Date(startOfLocalDay('2026-10-01'));
    const to = new Date(startOfNextLocalDay('2026-10-31'));

    expect([
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
      from.getHours(),
    ]).toEqual([2026, 9, 1, 0]);
    expect([
      to.getFullYear(),
      to.getMonth(),
      to.getDate(),
      to.getHours(),
    ]).toEqual([2026, 10, 1, 0]);
  });
});
