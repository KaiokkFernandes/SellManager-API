import { MigrationInterface, QueryRunner } from 'typeorm';

const STATUSES = "('pending', 'paid', 'shipped', 'delivered', 'canceled')";

/**
 * Histórico de status (quem, quando, de/para, motivo). Pedidos existentes
 * ganham a linha da criação e, se já saíram de pending, a da última mudança
 * (sem autor: o dado não existia).
 */
export class AddOrderStatusHistory1761351100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE order_status_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
        from_status varchar(20) NULL CHECK (from_status IN ${STATUSES}),
        to_status varchar(20) NOT NULL CHECK (to_status IN ${STATUSES}),
        changed_by_id uuid NULL REFERENCES users (id) ON DELETE SET NULL,
        reason text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_order_status_history_cancel_reason"
          CHECK (to_status <> 'canceled' OR reason IS NOT NULL)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_order_status_history_order" ON order_status_history (order_id, created_at)',
    );

    await queryRunner.query(`
      INSERT INTO order_status_history (order_id, from_status, to_status, created_at)
      SELECT id, NULL, 'pending', created_at FROM orders
    `);
    await queryRunner.query(`
      INSERT INTO order_status_history (order_id, from_status, to_status, reason, created_at)
      SELECT id, 'pending', status,
        CASE WHEN status = 'canceled' THEN 'Cancelado antes do registro de motivo' END,
        updated_at
      FROM orders WHERE status <> 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE order_status_history');
  }
}
