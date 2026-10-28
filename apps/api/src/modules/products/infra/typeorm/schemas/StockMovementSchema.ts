import { EntitySchema } from 'typeorm';
import { StockMovement } from '../../../domain/entities/StockMovement';

export type StockMovementRow = Omit<StockMovement, 'created_by'> & {
  created_by_id: string | null;
};

export const StockMovementSchema = new EntitySchema<StockMovementRow>({
  name: 'StockMovement',
  tableName: 'stock_movements',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    product_id: { type: 'uuid' },
    type: { type: 'varchar', length: 20 },
    quantity: { type: 'int' },
    balance_after: { type: 'int' },
    reason: { type: 'text', nullable: true },
    order_id: { type: 'uuid', nullable: true },
    created_by_id: { type: 'uuid', nullable: true },
    // default clock_timestamp() (migration): ordem real mesmo na mesma transação
    created_at: { type: 'timestamptz', createDate: true },
  },
});
