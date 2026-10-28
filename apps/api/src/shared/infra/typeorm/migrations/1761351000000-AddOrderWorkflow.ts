import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fluxo pending → paid → shipped → delivered (+ canceled). Pedidos
 * "completed" eram vendas encerradas: viram "delivered".
 */
export class AddOrderWorkflow1761351000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE orders DROP CONSTRAINT "CHK_orders_status"',
    );
    await queryRunner.query(
      `UPDATE orders SET status = 'delivered' WHERE status = 'completed'`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ADD CONSTRAINT "CHK_orders_status" CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'canceled'))`,
    );
    // filtro por status na listagem
    await queryRunner.query(
      'CREATE INDEX "IDX_orders_status" ON orders (status)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_orders_status"');
    await queryRunner.query(
      'ALTER TABLE orders DROP CONSTRAINT "CHK_orders_status"',
    );
    // o fluxo antigo não tinha pago/enviado: voltam a pendentes
    await queryRunner.query(
      `UPDATE orders SET status = CASE status WHEN 'delivered' THEN 'completed' WHEN 'canceled' THEN 'canceled' ELSE 'pending' END`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ADD CONSTRAINT "CHK_orders_status" CHECK (status IN ('pending', 'completed', 'canceled'))`,
    );
  }
}
