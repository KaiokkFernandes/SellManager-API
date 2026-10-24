import { EntitySchema } from 'typeorm';
import { Customer } from '../../../domain/entities/Customer';

export const CustomerSchema = new EntitySchema<Customer>({
  name: 'Customer',
  tableName: 'customers',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'varchar' },
    email: { type: 'varchar', unique: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
