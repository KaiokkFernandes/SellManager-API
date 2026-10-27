import { describe, expect, it } from 'vitest';
import { getTokenExpiry, isTokenExpired } from './jwt';

function tokenWith(claims: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode(claims)}.assinatura`;
}

describe('jwt', () => {
  it('lê o exp em ms', () => {
    expect(getTokenExpiry(tokenWith({ exp: 2000 }))).toBe(2_000_000);
  });

  it('detecta token expirado', () => {
    const token = tokenWith({ exp: 1000 });
    expect(isTokenExpired(token, 999_999)).toBe(false);
    expect(isTokenExpired(token, 1_000_000)).toBe(true);
  });

  it('token sem exp ou malformado não conta como expirado', () => {
    expect(getTokenExpiry(tokenWith({ sub: 'x' }))).toBeNull();
    expect(getTokenExpiry('lixo')).toBeNull();
    expect(isTokenExpired('lixo')).toBe(false);
  });
});
