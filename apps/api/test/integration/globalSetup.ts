import { AppDataSource } from '@shared/infra/typeorm/data-source';

/** Recria o schema do banco de teste e aplica todas as migrations. */
export async function setup(): Promise<void> {
  if (AppDataSource.options.database !== 'sellmanager_test') {
    throw new Error(
      `Testes de integração recusados: banco "${String(AppDataSource.options.database)}" não é o de teste`,
    );
  }

  await AppDataSource.initialize();
  await AppDataSource.dropDatabase();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}
