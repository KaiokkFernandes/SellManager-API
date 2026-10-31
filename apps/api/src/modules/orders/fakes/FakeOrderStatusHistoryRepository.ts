import { randomUUID } from 'node:crypto';
import { IUsersRepository } from '@modules/users/domain/repositories/IUsersRepository';
import { OrderStatusChange } from '../domain/entities/OrderStatusChange';
import {
  IAddOrderStatusChangeDTO,
  IOrderStatusHistoryRepository,
} from '../domain/repositories/IOrderStatusHistoryRepository';

type Row = Omit<OrderStatusChange, 'changed_by'> & { changed_by_id: string };

export class FakeOrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
  public readonly rows: Row[] = [];

  constructor(private readonly users?: IUsersRepository) {}

  public add({ reason, at, ...data }: IAddOrderStatusChangeDTO): Promise<void> {
    this.rows.push({
      ...data,
      id: randomUUID(),
      reason: reason ?? null,
      created_at: at,
    });
    return Promise.resolve();
  }

  public async findByOrder(orderId: string): Promise<OrderStatusChange[]> {
    const rows = this.rows.filter(row => row.order_id === orderId);
    return Promise.all(
      rows.map(async ({ changed_by_id, ...row }) => ({
        ...row,
        changed_by: {
          id: changed_by_id,
          name: (await this.users?.findById(changed_by_id))?.name ?? '',
        },
      })),
    );
  }
}
