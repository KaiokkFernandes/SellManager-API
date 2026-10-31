import { randomUUID } from 'node:crypto';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { Order } from '../domain/entities/Order';
import {
  ICreateOrderDTO,
  IFindOrdersFilter,
  IOrderStatusChanges,
  IOrdersRepository,
} from '../domain/repositories/IOrdersRepository';

export class FakeOrdersRepository implements IOrdersRepository {
  public readonly orders: Order[] = [];

  private clone(order: Order): Order {
    return {
      ...order,
      customer: { ...order.customer },
      items: order.items.map(item => ({
        ...item,
        product: { ...item.product },
      })),
    };
  }

  public findAll(
    filter: IFindOrdersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Order>> {
    return Promise.resolve(
      slicePage(
        this.orders
          .filter(
            order =>
              (!filter.customer_id ||
                order.customer_id === filter.customer_id) &&
              (!filter.status || order.status === filter.status) &&
              (!filter.from || order.created_at >= filter.from) &&
              (!filter.to || order.created_at < filter.to),
          )
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
          .map(order => this.clone(order)),
        pagination,
      ),
    );
  }

  public findById(id: string): Promise<Order | null> {
    const order = this.orders.find(item => item.id === id);
    return Promise.resolve(order ? this.clone(order) : null);
  }

  public findByIdForUpdate(id: string): Promise<Order | null> {
    return this.findById(id);
  }

  public countByCustomer(customerId: string): Promise<number> {
    return Promise.resolve(
      this.orders.filter(order => order.customer_id === customerId).length,
    );
  }

  public countByProduct(productId: string): Promise<number> {
    return Promise.resolve(
      this.orders.filter(order =>
        order.items.some(item => item.product_id === productId),
      ).length,
    );
  }

  public create({ items, ...data }: ICreateOrderDTO): Promise<Order> {
    const now = new Date();
    const id = randomUUID();
    const order: Order = {
      id,
      ...data,
      paid_at: null,
      canceled_at: null,
      items: items.map(item => ({ ...item, id: randomUUID(), order_id: id })),
      created_at: now,
      updated_at: now,
    };
    this.orders.push(order);
    return Promise.resolve(this.clone(order));
  }

  public updateStatus(
    id: string,
    changes: IOrderStatusChanges,
  ): Promise<Order> {
    const order = this.orders.find(item => item.id === id);
    if (!order) return Promise.reject(new Error('Order not found'));
    Object.assign(order, changes);
    order.updated_at = new Date();
    return Promise.resolve(this.clone(order));
  }
}
