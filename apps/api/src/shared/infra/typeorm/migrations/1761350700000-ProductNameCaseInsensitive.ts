import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nome de produto passa a ser único sem diferenciar maiúsculas ("Cabo" = "cabo"):
 * troca o UNIQUE(name) por um índice único em lower(name).
 */
export class ProductNameCaseInsensitive1761350700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates = (await queryRunner.query(
      'SELECT lower(name) AS name FROM products GROUP BY lower(name) HAVING count(*) > 1',
    )) as { name: string }[];
    if (duplicates.length > 0) {
      throw new Error(
        `Produtos com nomes que só diferem em maiúsculas: ${duplicates
          .map(row => row.name)
          .join(', ')}. Renomeie-os antes de rodar esta migration.`,
      );
    }

    const constraints = (await queryRunner.query(`
      SELECT c.conname FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.conrelid = 'products'::regclass AND c.contype = 'u' AND a.attname = 'name'
    `)) as { conname: string }[];
    for (const { conname } of constraints) {
      await queryRunner.query(
        `ALTER TABLE products DROP CONSTRAINT "${conname}"`,
      );
    }
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_products_name_lower" ON products (lower(name))',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "UQ_products_name_lower"');
    await queryRunner.query(
      'ALTER TABLE products ADD CONSTRAINT "UQ_products_name" UNIQUE (name)',
    );
  }
}
