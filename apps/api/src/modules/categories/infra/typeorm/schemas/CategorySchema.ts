import { EntitySchema } from 'typeorm';
import { Category } from '../../../domain/entities/Category';

export type CategoryRow = Omit<Category, 'products_count'>;

export const CategorySchema = new EntitySchema<CategoryRow>({
  name: 'Category',
  tableName: 'categories',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    // único sem diferenciar maiúsculas: índice em lower(name) (migration)
    name: { type: 'varchar', length: 60 },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
