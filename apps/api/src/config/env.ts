import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from './parseEnv';

// Relativo à pasta do app (apps/api), não ao cwd: funciona rodando pela raiz
// do monorepo, pelo Turborepo ou de dentro de apps/api (src/ e dist/).
const envFile = path.resolve(
  __dirname,
  '..',
  '..',
  process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
);

// Variáveis já definidas no ambiente (CI, Docker) têm precedência sobre o
// arquivo. Na Vercel o ambiente vem do painel: nenhum arquivo é lido.
if (!process.env.VERCEL && existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export const env = parseEnv(process.env);

export type { Env } from './parseEnv';
