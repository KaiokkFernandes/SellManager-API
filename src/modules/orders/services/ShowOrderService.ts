import AppError from '@shared/errors/AppError';
import { Order } from '../domain/entities/Order';
import { IOrdersRepository } from '../domain/repositories/IOrdersRepository';

export class ShowOrderService {
  constructor(private readonly ordersRepository: IOrdersRepository) {}

  public async execute({ id }: { id: string }): Promise<Order> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }
}
