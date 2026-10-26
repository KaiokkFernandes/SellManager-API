import { describe, expect, it } from 'vitest';
import { fromCents, toCents } from './money';

describe('money', () => {
  it('converte decimais com 2 casas para centavos sem erro de ponto flutuante', () => {
    expect(toCents(199.9)).toBe(19990);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
  });

  it('volta de centavos para decimal', () => {
    expect(fromCents(19990)).toBe(199.9);
    expect(fromCents(5)).toBe(0.05);
  });
});
