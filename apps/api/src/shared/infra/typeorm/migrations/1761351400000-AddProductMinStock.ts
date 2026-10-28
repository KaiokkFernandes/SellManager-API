import { MigrationInterface, QueryRunner } from 'typeorm';

/** Estoque mínimo por produto; existentes ficam com 0 (sem alerta). */
export class AddProductMinStock1761351400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE products ADD COLUMN min_stock int NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE products ADD CONSTRAINT "CHK_products_min_stock" CHECK (min_stock >= 0)',
    );
    // a lista de estoque baixo só lê os poucos produtos abaixo do mínimo
    await queryRunner.query(
      'CREATE INDEX "IDX_products_below_min_stock" ON products ((min_stock - quantity)) WHERE quantity < min_stock',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_products_below_min_stock"');
    await queryRunner.query('ALTER TABLE products DROP COLUMN min_stock');
  }
}
