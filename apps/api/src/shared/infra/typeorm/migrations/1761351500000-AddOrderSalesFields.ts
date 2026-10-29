import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Datas e autor no próprio pedido, para as métricas não lerem o histórico:
 * - paid_at: primeira saída de pending para um status pago (pedidos migrados
 *   de "completed" foram direto a delivered: vale essa data);
 * - canceled_at: a mudança para canceled;
 * - created_by: quem criou (primeira linha do histórico).
 * E os índices das consultas agregadas do dashboard.
 */
export class AddOrderSalesFields1761351500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
        ADD COLUMN paid_at timestamptz NULL,
        ADD COLUMN canceled_at timestamptz NULL,
        ADD COLUMN created_by uuid NULL REFERENCES users (id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      UPDATE orders o SET
        paid_at = (SELECT min(h.created_at) FROM order_status_history h
          WHERE h.order_id = o.id AND h.to_status IN ('paid', 'shipped', 'delivered')),
        canceled_at = (SELECT max(h.created_at) FROM order_status_history h
          WHERE h.order_id = o.id AND h.to_status = 'canceled'),
        created_by = (SELECT h.changed_by_id FROM order_status_history h
          WHERE h.order_id = o.id AND h.from_status IS NULL LIMIT 1)
    `);
    // pedido que chegou a ser pago sempre tem a data do pagamento
    await queryRunner.query(`
      ALTER TABLE orders ADD CONSTRAINT "CHK_orders_paid_at"
        CHECK (status NOT IN ('paid', 'shipped', 'delivered') OR paid_at IS NOT NULL)
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_orders_paid_at_sales" ON orders (paid_at) WHERE status <> 'canceled'`,
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_orders_canceled_at" ON orders (canceled_at) WHERE canceled_at IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_orders_created_by_paid_at" ON orders (created_by, paid_at)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_orders_created_at" ON orders (created_at)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_order_items_product" ON order_items (product_id)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_order_items_product"');
    await queryRunner.query('DROP INDEX "IDX_orders_created_at"');
    await queryRunner.query('DROP INDEX "IDX_orders_created_by_paid_at"');
    await queryRunner.query('DROP INDEX "IDX_orders_canceled_at"');
    await queryRunner.query('DROP INDEX "IDX_orders_paid_at_sales"');
    await queryRunner.query(
      'ALTER TABLE orders DROP CONSTRAINT "CHK_orders_paid_at"',
    );
    await queryRunner.query(`
      ALTER TABLE orders
        DROP COLUMN created_by, DROP COLUMN canceled_at, DROP COLUMN paid_at
    `);
  }
}
