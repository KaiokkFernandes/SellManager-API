import AppError from '@shared/errors/AppError';
import { OrderDetails } from '../domain/entities/Order';
import { IOrderStatusHistoryRepository } from '../domain/repositories/IOrderStatusHistoryRepository';
import { IOrdersRepository } from '../domain/repositories/IOrdersRepository';

export class ShowOrderService {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly historyRepository: IOrderStatusHistoryRepository,
  ) {}

  public async execute({ id }: { id: string }): Promise<OrderDetails> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return { ...order, history: await this.historyRepository.findByOrder(id) };
  }
}
