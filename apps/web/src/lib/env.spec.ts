import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('aceita URL absoluta e caminho, sem barra final', () => {
    expect(parseEnv({ VITE_API_URL: 'https://api.exemplo.com/' })).toEqual({
      VITE_API_URL: 'https://api.exemplo.com',
    });
    expect(parseEnv({ VITE_API_URL: '/api' }).VITE_API_URL).toBe('/api');
  });

  it('falha com mensagem clara quando falta a variável', () => {
    expect(() => parseEnv({})).toThrow(/VITE_API_URL/);
    expect(() => parseEnv({})).toThrow(/\.env\.example/);
  });

  it('falha com valor que não é URL nem caminho', () => {
    expect(() => parseEnv({ VITE_API_URL: 'api' })).toThrow(/URL válida/);
  });
});
