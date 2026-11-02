/* eslint-disable no-console -- comando de linha de comando */
// Aplica as migrations a partir do código compilado, sem o CLI do TypeORM.
// Uso: pnpm --filter api migration:run:prod
import 'reflect-metadata';
import { env } from '@config/env';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import { migrationDatabaseOptions } from '@shared/infra/typeorm/databaseOptions';

async function migrate(): Promise<void> {
  AppDataSource.setOptions(migrationDatabaseOptions(env));
  await AppDataSource.initialize();
  try {
    const applied = await AppDataSource.runMigrations({ transaction: 'all' });
    console.log(
      applied.length > 0
        ? `Migrations aplicadas: ${applied.map(({ name }) => name).join(', ')}`
        : 'Nenhuma migration pendente.',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

migrate().catch((error: unknown) => {
  // só mensagem e código: o objeto do erro pode carregar a URL de conexão
  const { message, code } = error as { message?: string; code?: string };
  console.error(
    'Falha ao aplicar as migrations:',
    message || code || 'erro desconhecido',
  );
  process.exit(1);
});
