import { describe, expect, it } from 'vitest';
import { parseEnv } from './parseEnv';

const base = { JWT_SECRET: 'x'.repeat(32) };
const vercel = { ...base, VERCEL: '1', VERCEL_ENV: 'production' };
const vercelReady = {
  ...vercel,
  APP_WEB_URL: 'https://loja.exemplo.com',
  MAIL_DRIVER: 'smtp',
  SMTP_HOST: 'smtp.exemplo.com',
};

describe('parseEnv', () => {
  it('fora da Vercel, assume desenvolvimento com padrões locais', () => {
    expect(parseEnv(base)).toMatchObject({
      NODE_ENV: 'development',
      APP_WEB_URL: 'http://localhost:3000',
      CORS_ORIGIN: ['http://localhost:3000'],
      TRUST_PROXY: 0,
    });
  });

  it('na Vercel, assume produção mesmo sem NODE_ENV', () => {
    expect(parseEnv(vercelReady)).toMatchObject({
      NODE_ENV: 'production',
      TRUST_PROXY: 1,
      CORS_ORIGIN: [],
    });
  });

  it('diz qual variável falta e não mostra valores', () => {
    const secret = 'segredo-curto';
    let message = '';
    try {
      parseEnv({ JWT_SECRET: secret });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/JWT_SECRET: JWT_SECRET precisa ter ao menos 32/);
    expect(message).toMatch(/\.env\.example/);
    expect(message).not.toContain(secret);

    expect(() => parseEnv({})).toThrow(/JWT_SECRET: obrigatória/);
  });

  it('na Vercel exige a URL do front, mas a deriva do domínio do deploy', () => {
    expect(() => parseEnv({ ...base, VERCEL: '1' })).toThrow(
      /APP_WEB_URL: obrigatória/,
    );
    expect(
      parseEnv({
        ...vercelReady,
        APP_WEB_URL: '',
        VERCEL_PROJECT_PRODUCTION_URL: 'loja.vercel.app',
      }).APP_WEB_URL,
    ).toBe('https://loja.vercel.app');
    expect(
      parseEnv({
        ...base,
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_BRANCH_URL: 'loja-git-x.vercel.app',
      }).APP_WEB_URL,
    ).toBe('https://loja-git-x.vercel.app');
  });

  it('recusa * no CORS em produção', () => {
    expect(() => parseEnv({ ...vercelReady, CORS_ORIGIN: '*' })).toThrow(
      /CORS_ORIGIN: não aceita \*/,
    );
    expect(parseEnv({ ...base, CORS_ORIGIN: '*' }).CORS_ORIGIN).toEqual(['*']);
  });

  it('na produção da Vercel exige smtp; no preview, não', () => {
    const withoutMail = { ...vercelReady, MAIL_DRIVER: '' };
    expect(() => parseEnv(withoutMail)).toThrow(
      /MAIL_DRIVER: precisa ser smtp/,
    );
    expect(() =>
      parseEnv({ ...withoutMail, VERCEL_ENV: 'preview' }),
    ).not.toThrow();
  });

  it('variável em branco equivale a não definida', () => {
    expect(parseEnv({ ...base, CORS_ORIGIN: '', PORT: '' }).PORT).toBe(3333);
  });
});
