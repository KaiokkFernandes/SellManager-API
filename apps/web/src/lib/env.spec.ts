import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('aceita URL absoluta e caminho, sem barra final', () => {
    expect(parseEnv({ VITE_API_URL: 'https://api.exemplo.com/' })).toEqual({
      VITE_API_URL: 'https://api.exemplo.com',
    });
    expect(parseEnv({ VITE_API_URL: '/api' }).VITE_API_URL).toBe('/api');
  });

  it('sem a variável, chama a API pelo caminho relativo /api', () => {
    expect(parseEnv({}).VITE_API_URL).toBe('/api');
  });

  it('falha com valor que não é URL nem caminho', () => {
    expect(() => parseEnv({ VITE_API_URL: 'api' })).toThrow(/URL válida/);
    expect(() => parseEnv({ VITE_API_URL: 'api' })).toThrow(/\.env\.example/);
  });
});
