import {
  Order,
  OrderCustomer,
  OrderItem,
  OrderStatus,
} from '../entities/Order';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateOrderDTO {
  customer_id: string;
  /** Resumos já carregados pelo service: devolvidos no pedido criado. */
  customer: OrderCustomer;
  status: OrderStatus;
  total: number;
  items: Pick<OrderItem, 'product_id' | 'product' | 'price' | 'quantity'>[];
}

export interface IFindOrdersFilter {
  customer_id?: string;
  /** Criados a partir deste instante (inclusivo). */
  from?: Date;
  /** Criados antes deste instante (exclusivo). */
  to?: Date;
}

export interface IOrdersRepository {
  findAll(
    filter: IFindOrdersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Order>>;
  findById(id: string): Promise<Order | null>;
  /** Busca e trava o pedido até o fim da unidade de trabalho atual. */
  findByIdForUpdate(id: string): Promise<Order | null>;
  /** Quantos pedidos o cliente tem (bloqueia a exclusão do cliente). */
  countByCustomer(customerId: string): Promise<number>;
  /** Em quantos pedidos o produto aparece (bloqueia a exclusão do produto). */
  countByProduct(productId: string): Promise<number>;
  create(data: ICreateOrderDTO): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
