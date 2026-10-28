import { EntitySchema } from 'typeorm';
import { User } from '../../../domain/entities/User';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'varchar' },
    email: { type: 'varchar', unique: true },
    password: { type: 'varchar' },
    avatar: { type: 'varchar', nullable: true },
    role: { type: 'varchar', length: 20 },
    active: { type: 'boolean', default: true },
    password_changed_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
