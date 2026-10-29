import { MigrationInterface, QueryRunner } from 'typeorm';

/** Categorias de produto; produtos existentes ficam sem categoria. */
export class AddCategories1761351300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(60) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    // único sem diferenciar maiúsculas, como o nome do produto
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_categories_name_lower" ON categories (lower(name))',
    );
    await queryRunner.query(
      'ALTER TABLE products ADD COLUMN category_id uuid NULL REFERENCES categories (id) ON DELETE RESTRICT',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_products_category" ON products (category_id)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE products DROP COLUMN category_id');
    await queryRunner.query('DROP TABLE categories');
  }
}
