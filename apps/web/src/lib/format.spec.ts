import { describe, expect, it } from 'vitest';
import { centsToInput, formatCents, formatDate, parseCents } from './format';

const nbsp = ' ';

describe('format', () => {
  it('formata centavos em BRL', () => {
    expect(formatCents(123456)).toBe(`R$${nbsp}1.234,56`);
    expect(formatCents(0)).toBe(`R$${nbsp}0,00`);
  });

  it('converte o texto digitado em centavos', () => {
    expect(parseCents('1.234,56')).toBe(123456);
    expect(parseCents('R$ 12,5')).toBe(1250);
    expect(parseCents('10')).toBe(1000);
    expect(parseCents('0,07')).toBe(7);
  });

  it('rejeita texto inválido', () => {
    expect(parseCents('')).toBeNull();
    expect(parseCents('abc')).toBeNull();
    expect(parseCents('1,234')).toBeNull();
    expect(parseCents('-5')).toBeNull();
  });

  it('centsToInput e parseCents são inversos', () => {
    expect(centsToInput(123456)).toBe('1234,56');
    expect(parseCents(centsToInput(123456))).toBe(123456);
  });

  it('formata datas em pt-BR', () => {
    expect(formatDate('2026-10-26T12:00:00.000Z')).toBe('26/10/2026');
  });
});
