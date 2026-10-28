import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Papel e situação do usuário. Quem já existia vira ADMIN (antes não havia
 * restrição alguma); daqui para frente todo usuário é criado com o papel
 * informado, por isso a coluna fica sem default.
 */
export class AddUserRoles1761350900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN role varchar(20) NOT NULL DEFAULT 'ADMIN'`,
    );
    await queryRunner.query('ALTER TABLE users ALTER COLUMN role DROP DEFAULT');
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT "CHK_users_role" CHECK (role IN ('ADMIN', 'MANAGER', 'SELLER'))`,
    );
    await queryRunner.query(
      'ALTER TABLE users ADD COLUMN active boolean NOT NULL DEFAULT true',
    );
    // tokens emitidos antes da última troca de senha deixam de valer
    await queryRunner.query(
      'ALTER TABLE users ADD COLUMN password_changed_at timestamptz NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE users DROP COLUMN password_changed_at',
    );
    await queryRunner.query('ALTER TABLE users DROP COLUMN active');
    await queryRunner.query(
      'ALTER TABLE users DROP CONSTRAINT "CHK_users_role"',
    );
    await queryRunner.query('ALTER TABLE users DROP COLUMN role');
  }
}
