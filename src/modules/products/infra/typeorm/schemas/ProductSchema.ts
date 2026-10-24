import { EntitySchema } from 'typeorm';
import { Product } from '../../../domain/entities/Product';

export const ProductSchema = new EntitySchema<Product>({
  name: 'Product',
  tableName: 'products',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'varchar', unique: true },
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      // o driver pg devolve decimal como string
      transformer: {
        to: (value: number) => value,
        from: (value: string) => Number(value),
      },
    },
    quantity: { type: 'int' },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
