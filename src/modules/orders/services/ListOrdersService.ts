import { Order } from '../domain/entities/Order';
import {
  IFindOrdersFilter,
  IOrdersRepository,
} from '../domain/repositories/IOrdersRepository';

export class ListOrdersService {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  public execute(filter: IFindOrdersFilter = {}): Promise<Order[]> {
    return this.ordersRepository.findAll(filter);
  }
}
