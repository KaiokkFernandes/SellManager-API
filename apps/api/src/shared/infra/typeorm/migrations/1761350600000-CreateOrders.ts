import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const timestamps = [
  { name: 'created_at', type: 'timestamptz', default: 'now()' },
  { name: 'updated_at', type: 'timestamptz', default: 'now()' },
];

export class CreateOrders1761350600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'customer_id', type: 'uuid' },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          { name: 'total', type: 'decimal', precision: 12, scale: 2 },
          ...timestamps,
        ],
        foreignKeys: [
          {
            name: 'FK_orders_customer',
            columnNames: ['customer_id'],
            referencedTableName: 'customers',
            referencedColumnNames: ['id'],
            // pedidos são histórico: um cliente com pedidos não pode ser apagado
            onDelete: 'RESTRICT',
          },
        ],
        checks: [
          {
            name: 'CHK_orders_status',
            expression: "status IN ('pending', 'completed', 'canceled')",
          },
          { name: 'CHK_orders_total', expression: 'total >= 0' },
        ],
        indices: [
          { name: 'IDX_orders_customer', columnNames: ['customer_id'] },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'order_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          // preço copiado do produto no momento da compra
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'quantity', type: 'int' },
          ...timestamps,
        ],
        foreignKeys: [
          {
            name: 'FK_order_items_order',
            columnNames: ['order_id'],
            referencedTableName: 'orders',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_order_items_product',
            columnNames: ['product_id'],
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
        checks: [
          { name: 'CHK_order_items_quantity', expression: 'quantity > 0' },
          { name: 'CHK_order_items_price', expression: 'price >= 0' },
        ],
        indices: [{ name: 'IDX_order_items_order', columnNames: ['order_id'] }],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_items');
    await queryRunner.dropTable('orders');
  }
}
