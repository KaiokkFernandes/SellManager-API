import { Order, OrderItem, OrderStatus } from '../entities/Order';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateOrderDTO {
  customer_id: string;
  status: OrderStatus;
  total: number;
  items: Pick<OrderItem, 'product_id' | 'price' | 'quantity'>[];
}

export interface IFindOrdersFilter {
  customer_id?: string;
}

export interface IOrdersRepository {
  findAll(
    filter: IFindOrdersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Order>>;
  findById(id: string): Promise<Order | null>;
  /** Busca e trava o pedido até o fim da unidade de trabalho atual. */
  findByIdForUpdate(id: string): Promise<Order | null>;
  create(data: ICreateOrderDTO): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
