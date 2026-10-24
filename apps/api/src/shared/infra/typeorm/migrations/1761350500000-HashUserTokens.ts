import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * O token de recuperação de senha passa a ser guardado como hash SHA-256
 * (o valor em claro só existe no e-mail). Tokens antigos são descartados.
 */
export class HashUserTokens1761350500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM user_tokens');
    await queryRunner.query('ALTER TABLE user_tokens DROP COLUMN token');
    await queryRunner.query(
      'ALTER TABLE user_tokens ADD COLUMN token_hash varchar(64) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE user_tokens ADD CONSTRAINT "UQ_user_tokens_token_hash" UNIQUE (token_hash)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM user_tokens');
    await queryRunner.query('ALTER TABLE user_tokens DROP COLUMN token_hash');
    await queryRunner.query(
      'ALTER TABLE user_tokens ADD COLUMN token uuid NOT NULL DEFAULT gen_random_uuid()',
    );
  }
}
