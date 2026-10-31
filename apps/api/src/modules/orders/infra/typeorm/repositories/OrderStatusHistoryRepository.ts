import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { UserSchema } from '@modules/users/infra/typeorm/schemas/UserSchema';
import { OrderStatusChange } from '../../../domain/entities/OrderStatusChange';
import {
  IAddOrderStatusChangeDTO,
  IOrderStatusHistoryRepository,
} from '../../../domain/repositories/IOrderStatusHistoryRepository';
import {
  OrderStatusHistoryRow,
  OrderStatusHistorySchema,
} from '../schemas/OrderStatusHistorySchema';

export class OrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
  private readonly rows: Repository<OrderStatusHistoryRow>;

  constructor(private readonly connection: DataSource | EntityManager) {
    this.rows = connection.getRepository(OrderStatusHistorySchema);
  }

  public async add({
    reason,
    at,
    ...data
  }: IAddOrderStatusChangeDTO): Promise<void> {
    await this.rows.insert({ ...data, reason: reason ?? null, created_at: at });
  }

  public async findByOrder(orderId: string): Promise<OrderStatusChange[]> {
    const rows = await this.rows.find({
      where: { order_id: orderId },
      // mesma transação pode gravar duas linhas no mesmo instante: id desempata
      order: { created_at: 'ASC', id: 'ASC' },
    });
    const userIds = [...new Set(rows.flatMap(row => row.changed_by_id ?? []))];
    const users = userIds.length
      ? await this.connection.getRepository(UserSchema).find({
          select: { id: true, name: true },
          where: { id: In(userIds) },
        })
      : [];
    const nameById = new Map(users.map(({ id, name }) => [id, name]));

    return rows.map(({ changed_by_id, ...row }) => ({
      ...row,
      changed_by: changed_by_id
        ? { id: changed_by_id, name: nameById.get(changed_by_id) ?? '' }
        : null,
    }));
  }
}
