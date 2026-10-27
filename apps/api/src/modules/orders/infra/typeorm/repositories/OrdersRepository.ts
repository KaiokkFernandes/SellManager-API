import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CustomerSchema } from '@modules/customers/infra/typeorm/schemas/CustomerSchema';
import { ProductSchema } from '@modules/products/infra/typeorm/schemas/ProductSchema';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import {
  Order,
  OrderCustomer,
  OrderItem,
  OrderStatus,
} from '../../../domain/entities/Order';
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

function toOrderItem(
  { id, order_id, product_id, price, quantity }: OrderItemRow,
  productName: string,
): OrderItem {
  return {
    id,
    order_id,
    product_id,
    product: { id: product_id, name: productName },
    price,
    quantity,
  };
}

export class OrdersRepository implements IOrdersRepository {
  private readonly orders: Repository<OrderRow>;
  private readonly items: Repository<OrderItemRow>;
  private readonly connection: DataSource | EntityManager;

  constructor(connection: DataSource | EntityManager) {
    this.connection = connection;
    this.orders = connection.getRepository(OrderSchema);
    this.items = connection.getRepository(OrderItemSchema);
  }

  /** Itens, clientes e nomes de produto da página inteira em 3 consultas (sem N+1). */
  private async hydrate(rows: OrderRow[]): Promise<Order[]> {
    if (rows.length === 0) return [];

    const items = await this.items.find({
      where: { order_id: In(rows.map(row => row.id)) },
      order: { created_at: 'ASC', id: 'ASC' },
    });
    const [customers, products] = await Promise.all([
      this.connection.getRepository(CustomerSchema).find({
        select: { id: true, name: true, email: true },
        where: { id: In([...new Set(rows.map(row => row.customer_id))]) },
      }),
      this.connection.getRepository(ProductSchema).find({
        select: { id: true, name: true },
        where: { id: In([...new Set(items.map(item => item.product_id))]) },
      }),
    ]);
    const customerById = new Map<string, OrderCustomer>(
      customers.map(({ id, name, email }) => [id, { id, name, email }]),
    );
    const productName = new Map(products.map(({ id, name }) => [id, name]));

    return rows.map(row => ({
      ...row,
      // FKs RESTRICT garantem que cliente e produto existem enquanto houver pedido
      customer: customerById.get(row.customer_id) ?? {
        id: row.customer_id,
        name: '',
        email: '',
      },
      items: items
        .filter(item => item.order_id === row.id)
        .map(item => toOrderItem(item, productName.get(item.product_id) ?? '')),
    }));
  }

  public async findAll(
    { customer_id, from, to }: IFindOrdersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Order>> {
    const query = this.orders.createQueryBuilder('order');
    if (customer_id) {
      query.andWhere('order.customer_id = :customer_id', { customer_id });
    }
    if (from) query.andWhere('order.created_at >= :from', { from });
    if (to) query.andWhere('order.created_at < :to', { to });

    const { skip, take } = toSkipTake(pagination);
    const [rows, total] = await query
      .orderBy('order.created_at', 'DESC')
      .addOrderBy('order.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items: await this.hydrate(rows), total };
  }

  public async findById(id: string): Promise<Order | null> {
    const row = await this.orders.findOneBy({ id });
    return row ? ((await this.hydrate([row]))[0] ?? null) : null;
  }

  public async findByIdForUpdate(id: string): Promise<Order | null> {
    const row = await this.orders.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    return row ? ((await this.hydrate([row]))[0] ?? null) : null;
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

  public async create({
    customer,
    items,
    ...data
  }: ICreateOrderDTO): Promise<Order> {
    const order = await this.orders.save(this.orders.create(data));
    const savedItems = await this.items.save(
      items.map(({ product_id, price, quantity }) =>
        this.items.create({ product_id, price, quantity, order_id: order.id }),
      ),
    );
    return {
      ...order,
      customer,
      items: savedItems.map((item, index) =>
        toOrderItem(item, items[index]?.product.name ?? ''),
      ),
    };
  }

  public async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await this.orders.update({ id }, { status });
    const order = await this.findById(id);
    if (!order) throw new Error(`Order ${id} not found after update`);
    return order;
  }
}
