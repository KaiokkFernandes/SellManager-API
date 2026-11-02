import { describe, expect, it } from 'vitest';
import {
  databaseOptions,
  isLocalDatabase,
  migrationDatabaseOptions,
} from './databaseOptions';

const local = {
  DB_HOST: 'localhost',
  DB_PORT: 5433,
  DB_USER: 'u',
  DB_PASSWORD: 'p',
  DB_NAME: 'db',
};
const pooled =
  'postgresql://u:p@ep-x-pooler.us-east-1.aws.neon.tech/db?sslmode=require&channel_binding=require';
const direct = 'postgresql://u:p@ep-x.us-east-1.aws.neon.tech/db';

describe('databaseOptions', () => {
  it('com DATABASE_URL remota, exige SSL validando o certificado', () => {
    expect(databaseOptions({ ...local, DATABASE_URL: pooled })).toMatchObject({
      url: 'postgresql://u:p@ep-x-pooler.us-east-1.aws.neon.tech/db',
      ssl: { rejectUnauthorized: true },
    });
  });

  it('banco local não usa SSL', () => {
    expect(databaseOptions(local)).toMatchObject({
      host: 'localhost',
      ssl: false,
    });
  });

  it('pool pequeno e ocioso curto, sem CREATE EXTENSION ao conectar', () => {
    expect(databaseOptions(local)).toMatchObject({
      extra: { max: 5, idleTimeoutMillis: 10_000 },
      installExtensions: false,
    });
  });

  it('migrations preferem a conexão direta, com uma conexão só', () => {
    const options = migrationDatabaseOptions({
      ...local,
      DATABASE_URL: pooled,
      DATABASE_URL_UNPOOLED: direct,
    });
    expect(options).toMatchObject({ url: direct, extra: { max: 1 } });
  });

  it('sem a conexão direta, migrations usam a DATABASE_URL', () => {
    const options = migrationDatabaseOptions({
      ...local,
      DATABASE_URL: pooled,
    });
    expect(options).toMatchObject({
      url: expect.stringContaining('-pooler') as string,
    });
  });

  it('reconhece banco local e remoto', () => {
    expect(isLocalDatabase(local)).toBe(true);
    expect(
      isLocalDatabase({ ...local, DATABASE_URL: 'postgres://u@127.0.0.1/db' }),
    ).toBe(true);
    expect(isLocalDatabase({ ...local, DATABASE_URL: pooled })).toBe(false);
    expect(isLocalDatabase({ ...local, DB_HOST: 'db.exemplo.com' })).toBe(
      false,
    );
  });
});
