import { EntitySchema, ValueTransformer } from 'typeorm';
import { Order, OrderItem } from '../../../domain/entities/Order';

// Linhas das tabelas; os itens são carregados à parte pelo repositório.
export type OrderRow = Omit<Order, 'items' | 'customer'>;
export type OrderItemRow = Omit<OrderItem, 'product'> & {
  created_at: Date;
  updated_at: Date;
};

// o driver pg devolve decimal como string
const decimal: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

export const OrderSchema = new EntitySchema<OrderRow>({
  name: 'Order',
  tableName: 'orders',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    customer_id: { type: 'uuid' },
    status: { type: 'varchar', length: 20 },
    total: { type: 'decimal', precision: 12, scale: 2, transformer: decimal },
    paid_at: { type: 'timestamptz', nullable: true },
    canceled_at: { type: 'timestamptz', nullable: true },
    created_by: { type: 'uuid', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});

export const OrderItemSchema = new EntitySchema<OrderItemRow>({
  name: 'OrderItem',
  tableName: 'order_items',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    order_id: { type: 'uuid' },
    product_id: { type: 'uuid' },
    price: { type: 'decimal', precision: 10, scale: 2, transformer: decimal },
    quantity: { type: 'int' },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
