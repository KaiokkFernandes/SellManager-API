import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it('aceita caminhos internos', () => {
    expect(safeRedirect('/products?page=2')).toBe('/products?page=2');
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'products',
    '',
    '/login',
  ])('rejeita %j', value => {
    expect(safeRedirect(value)).toBeUndefined();
  });

  it('rejeita undefined', () => {
    expect(safeRedirect(undefined)).toBeUndefined();
  });
});
