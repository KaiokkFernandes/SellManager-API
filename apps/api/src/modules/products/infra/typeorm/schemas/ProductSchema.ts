import { EntitySchema } from 'typeorm';
import { Product } from '../../../domain/entities/Product';

export type ProductRow = Omit<Product, 'category'>;

export const ProductSchema = new EntitySchema<ProductRow>({
  name: 'Product',
  tableName: 'products',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    // único sem diferenciar maiúsculas: índice em lower(name) (migration)
    name: { type: 'varchar' },
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
    min_stock: { type: 'int', default: 0 },
    category_id: { type: 'uuid', nullable: true },
    image: { type: 'varchar', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
