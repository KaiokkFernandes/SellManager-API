import { existsSync } from 'node:fs';
import { z } from 'zod';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

// Variáveis já definidas no ambiente (CI, Docker) têm precedência sobre o arquivo.
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const envSchema = z.object({
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

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
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
