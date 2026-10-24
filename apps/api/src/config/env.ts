import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// Relativo à pasta do app (apps/api), não ao cwd: funciona rodando pela raiz
// do monorepo, pelo Turborepo ou de dentro de apps/api (src/ e dist/).
const envFile = path.resolve(
  __dirname,
  '..',
  '..',
  process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
);

// Variáveis já definidas no ambiente (CI, Docker) têm precedência sobre o arquivo.
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    APP_API_URL: z.url().default('http://localhost:3333'),
    APP_WEB_URL: z.url().default('http://localhost:3000'),

    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().int().positive().default(5433),
    DB_USER: z.string().default('sellmanager'),
    DB_PASSWORD: z.string().default('sellmanager'),
    DB_NAME: z.string().default('sellmanager'),

    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('1d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    // Origens permitidas no CORS, separadas por vírgula ('*' libera todas)
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000')
      .transform(value => value.split(',').map(origin => origin.trim())),
    // Número de proxies reversos à frente da API (para o IP real no rate limit)
    TRUST_PROXY: z.coerce.number().int().nonnegative().default(0),

    // E-mail: 'ethereal' (caixa de teste, só para dev) ou 'smtp'
    MAIL_DRIVER: z.enum(['ethereal', 'smtp']).default('ethereal'),
    MAIL_FROM_NAME: z.string().default('Equipe SellManager'),
    MAIL_FROM_EMAIL: z.email().default('no-reply@sellmanager.dev'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .optional(),
  })
  .refine(data => data.MAIL_DRIVER !== 'smtp' || data.SMTP_HOST, {
    message: 'SMTP_HOST é obrigatório quando MAIL_DRIVER=smtp',
    path: ['SMTP_HOST'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // o logger depende do env validado, por isso console aqui
  // eslint-disable-next-line no-console
  console.error(
    'Variáveis de ambiente inválidas:',
    z.treeifyError(parsed.error).properties,
  );
  throw new Error('Variáveis de ambiente inválidas. Veja .env.example.');
}

export const env = parsed.data;

export type Env = typeof env;
