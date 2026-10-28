import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Livro de estoque: toda mudança de saldo vira uma linha. Produtos existentes
 * ganham uma movimentação INITIAL com o saldo atual, então a soma das
 * movimentações bate com products.quantity desde o primeiro dia.
 */
export class AddStockMovements1761351200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE stock_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        type varchar(20) NOT NULL,
        quantity int NOT NULL,
        balance_after int NOT NULL,
        reason text NULL,
        order_id uuid NULL REFERENCES orders (id) ON DELETE RESTRICT,
        created_by_id uuid NULL REFERENCES users (id) ON DELETE SET NULL,
        -- clock_timestamp: ordem real mesmo dentro da mesma transação
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        CONSTRAINT "CHK_stock_movements_type"
          CHECK (type IN ('INITIAL', 'ENTRY', 'SALE', 'CANCEL_RETURN', 'ADJUSTMENT')),
        CONSTRAINT "CHK_stock_movements_sign" CHECK (
          quantity <> 0 AND (
            (type IN ('INITIAL', 'ENTRY', 'CANCEL_RETURN') AND quantity > 0)
            OR (type = 'SALE' AND quantity < 0)
            OR type = 'ADJUSTMENT'
          )
        ),
        CONSTRAINT "CHK_stock_movements_balance" CHECK (balance_after >= 0),
        CONSTRAINT "CHK_stock_movements_adjustment_reason"
          CHECK (type <> 'ADJUSTMENT' OR reason IS NOT NULL),
        CONSTRAINT "CHK_stock_movements_order"
          CHECK (type NOT IN ('SALE', 'CANCEL_RETURN') OR order_id IS NOT NULL)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_stock_movements_product" ON stock_movements (product_id, created_at)',
    );
    await queryRunner.query(`
      INSERT INTO stock_movements (product_id, type, quantity, balance_after, reason)
      SELECT id, 'INITIAL', quantity, quantity, 'Saldo na migração'
      FROM products WHERE quantity > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE stock_movements');
  }
}
