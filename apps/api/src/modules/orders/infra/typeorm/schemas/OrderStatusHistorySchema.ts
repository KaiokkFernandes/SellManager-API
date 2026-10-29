import { EntitySchema } from 'typeorm';
import { OrderStatusChange } from '../../../domain/entities/OrderStatusChange';

export type OrderStatusHistoryRow = Omit<OrderStatusChange, 'changed_by'> & {
  changed_by_id: string | null;
};

export const OrderStatusHistorySchema = new EntitySchema<OrderStatusHistoryRow>(
  {
    name: 'OrderStatusHistory',
    tableName: 'order_status_history',
    columns: {
      id: { type: 'uuid', primary: true, generated: 'uuid' },
      order_id: { type: 'uuid' },
      from_status: { type: 'varchar', length: 20, nullable: true },
      to_status: { type: 'varchar', length: 20 },
      changed_by_id: { type: 'uuid', nullable: true },
      reason: { type: 'text', nullable: true },
      created_at: { type: 'timestamptz', createDate: true },
    },
  },
);
