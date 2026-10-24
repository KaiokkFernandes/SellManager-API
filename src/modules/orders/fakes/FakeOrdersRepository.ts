import { randomUUID } from 'node:crypto';
import { Order, OrderStatus } from '../domain/entities/Order';
import {
  ICreateOrderDTO,
  IFindOrdersFilter,
  IOrdersRepository,
} from '../domain/repositories/IOrdersRepository';

export class FakeOrdersRepository implements IOrdersRepository {
  public readonly orders: Order[] = [];

  private clone(order: Order): Order {
    return { ...order, items: order.items.map(item => ({ ...item })) };
  }

  public findAll(filter: IFindOrdersFilter = {}): Promise<Order[]> {
    return Promise.resolve(
      this.orders
        .filter(
          order =>
            !filter.customer_id || order.customer_id === filter.customer_id,
        )
        .map(order => this.clone(order)),
    );
  }

  public findById(id: string): Promise<Order | null> {
    const order = this.orders.find(item => item.id === id);
    return Promise.resolve(order ? this.clone(order) : null);
  }

  public findByIdForUpdate(id: string): Promise<Order | null> {
    return this.findById(id);
  }

  public create({ items, ...data }: ICreateOrderDTO): Promise<Order> {
    const now = new Date();
    const id = randomUUID();
    const order: Order = {
      id,
      ...data,
      items: items.map(item => ({ ...item, id: randomUUID(), order_id: id })),
      created_at: now,
      updated_at: now,
    };
    this.orders.push(order);
    return Promise.resolve(this.clone(order));
  }

  public updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = this.orders.find(item => item.id === id);
    if (!order) return Promise.reject(new Error('Order not found'));
    order.status = status;
    order.updated_at = new Date();
    return Promise.resolve(this.clone(order));
  }
}
