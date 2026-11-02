import type { Env } from '@config/env';

type DatabaseEnv = Pick<
  Env,
  'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME'
> & { DATABASE_URL?: string; DATABASE_URL_UNPOOLED?: string };

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

/**
 * Por instância. Quem multiplexa de verdade é o pooler do Neon (PgBouncer em
 * modo transaction), então não adianta um pool grande aqui; mas uma instância
 * atende requisições simultâneas e cada CSV segura uma conexão até o fim, por
 * isso 1 seria pouco. A ociosidade curta devolve as conexões quando a função
 * fica parada.
 */
const POOL = {
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
};

function hostOf({ DATABASE_URL, DB_HOST }: DatabaseEnv): string {
  return DATABASE_URL ? new URL(DATABASE_URL).hostname : DB_HOST;
}

/** True se a conexão aponta para a própria máquina (docker do desenvolvimento). */
export function isLocalDatabase(env: DatabaseEnv): boolean {
  return LOCAL_HOSTS.includes(hostOf(env));
}

/**
 * Quem define o SSL é o `ssl` abaixo: o sslmode da URL do Neon só geraria um
 * aviso do driver, e o channel_binding não é lido por ele.
 */
function withoutSslParams(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete('sslmode');
  parsed.searchParams.delete('channel_binding');
  return parsed.toString();
}

/** Conexão do DataSource: `DATABASE_URL` (com SSL) ou as variáveis DB_* locais. */
export function databaseOptions(env: DatabaseEnv) {
  const common = {
    extra: POOL,
    // o Neon já tem o que as migrations usam, e o pooler não é lugar de DDL
    installExtensions: false,
    ssl: isLocalDatabase(env) ? false : { rejectUnauthorized: true },
  };

  if (env.DATABASE_URL) {
    return { ...common, url: withoutSslParams(env.DATABASE_URL) };
  }
  return {
    ...common,
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  };
}

/**
 * Migrations vão pela conexão direta: DDL e transação longa não passam bem
 * pelo pooler. Sem a direta, usam a DATABASE_URL.
 */
export function migrationDatabaseOptions(env: DatabaseEnv) {
  const options = databaseOptions({
    ...env,
    DATABASE_URL: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL,
  });
  return { ...options, extra: { ...POOL, max: 1 } };
}
