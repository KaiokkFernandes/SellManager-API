import { EntitySchema } from 'typeorm';
import { UserToken } from '../../../domain/entities/UserToken';

export const UserTokenSchema = new EntitySchema<UserToken>({
  name: 'UserToken',
  tableName: 'user_tokens',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    token: { type: 'uuid', generated: 'uuid' },
    user_id: { type: 'uuid' },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
