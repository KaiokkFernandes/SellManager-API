import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { Order, OrderItem, OrderStatus } from '../../../domain/entities/Order';
import {
  ICreateOrderDTO,
  IFindOrdersFilter,
  IOrdersRepository,
} from '../../../domain/repositories/IOrdersRepository';
import {
  OrderItemRow,
  OrderItemSchema,
  OrderRow,
  OrderSchema,
} from '../schemas/OrderSchemas';

function toOrderItem({
  id,
  order_id,
  product_id,
  price,
  quantity,
}: OrderItemRow): OrderItem {
  return { id, order_id, product_id, price, quantity };
}

export class OrdersRepository implements IOrdersRepository {
  private readonly orders: Repository<OrderRow>;
  private readonly items: Repository<OrderItemRow>;

  constructor(connection: DataSource | EntityManager) {
    this.orders = connection.getRepository(OrderSchema);
    this.items = connection.getRepository(OrderItemSchema);
  }

  private async withItems(rows: OrderRow[]): Promise<Order[]> {
    if (rows.length === 0) return [];

    const items = await this.items.find({
      where: { order_id: In(rows.map(row => row.id)) },
      order: { created_at: 'ASC', id: 'ASC' },
    });

    return rows.map(row => ({
      ...row,
      items: items.filter(item => item.order_id === row.id).map(toOrderItem),
    }));
  }

  public async findAll(
    filter: IFindOrdersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Order>> {
    const [rows, total] = await this.orders.findAndCount({
      where: filter.customer_id ? { customer_id: filter.customer_id } : {},
      order: { created_at: 'DESC', id: 'ASC' },
      ...toSkipTake(pagination),
    });
    return { items: await this.withItems(rows), total };
  }

  public async findById(id: string): Promise<Order | null> {
    const row = await this.orders.findOneBy({ id });
    return row ? ((await this.withItems([row]))[0] ?? null) : null;
  }

  public async findByIdForUpdate(id: string): Promise<Order | null> {
    const row = await this.orders.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    return row ? ((await this.withItems([row]))[0] ?? null) : null;
  }

  public countByCustomer(customerId: string): Promise<number> {
    return this.orders.countBy({ customer_id: customerId });
  }

  public async countByProduct(productId: string): Promise<number> {
    const rows = await this.items
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.order_id)', 'count')
      .where('item.product_id = :productId', { productId })
      .getRawOne<{ count: string }>();
    return Number(rows?.count ?? 0);
  }

  public async create({ items, ...data }: ICreateOrderDTO): Promise<Order> {
    const order = await this.orders.save(this.orders.create(data));

    const savedItems = await this.items.save(
      items.map(item => this.items.create({ ...item, order_id: order.id })),
    );

    return { ...order, items: savedItems.map(toOrderItem) };
  }

  public async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.orders.update({ id }, { status });
    const order = await this.findById(id);
    if (!order) throw new Error(`Order ${id} not found after update`);
    return order;
  }
}
