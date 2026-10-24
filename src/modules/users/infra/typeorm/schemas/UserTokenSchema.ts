import { EntitySchema } from 'typeorm';
import { UserToken } from '../../../domain/entities/UserToken';

export const UserTokenSchema = new EntitySchema<UserToken>({
  name: 'UserToken',
  tableName: 'user_tokens',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    token_hash: { type: 'varchar', length: 64, unique: true },
    user_id: { type: 'uuid' },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
