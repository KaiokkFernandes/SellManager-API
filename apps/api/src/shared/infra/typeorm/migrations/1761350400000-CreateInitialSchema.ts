import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const id = {
  name: 'id',
  type: 'uuid',
  isPrimary: true,
  default: 'gen_random_uuid()',
};

const timestamps = [
  { name: 'created_at', type: 'timestamptz', default: 'now()' },
  { name: 'updated_at', type: 'timestamptz', default: 'now()' },
];

export class CreateInitialSchema1761350400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          id,
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          { name: 'avatar', type: 'varchar', isNullable: true },
          ...timestamps,
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_tokens',
        columns: [
          id,
          { name: 'token', type: 'uuid', default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid' },
          ...timestamps,
        ],
        foreignKeys: [
          {
            name: 'FK_user_tokens_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          id,
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'quantity', type: 'int' },
          ...timestamps,
        ],
        checks: [
          { name: 'CHK_products_price', expression: 'price >= 0' },
          { name: 'CHK_products_quantity', expression: 'quantity >= 0' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          id,
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar', isUnique: true },
          ...timestamps,
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('customers');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('user_tokens');
    await queryRunner.dropTable('users');
  }
}
