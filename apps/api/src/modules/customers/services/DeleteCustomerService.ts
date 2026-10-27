import type { IOrdersRepository } from '@modules/orders/domain/repositories/IOrdersRepository';
import AppError from '@shared/errors/AppError';
import { ICustomersRepository } from '../domain/repositories/ICustomersRepository';

export class DeleteCustomerService {
  constructor(
    private readonly customersRepository: ICustomersRepository,
    private readonly ordersRepository: Pick<
      IOrdersRepository,
      'countByCustomer'
    >,
  ) {}

  public async execute({ id }: { id: string }): Promise<void> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // pedidos são histórico: cliente com pedidos não pode ser apagado
    // (a FK RESTRICT no banco é a rede de segurança)
    const ordersCount = await this.ordersRepository.countByCustomer(id);
    if (ordersCount > 0) {
      throw new AppError('Customer has orders and cannot be deleted', 409, {
        code: 'RESOURCE_IN_USE',
        details: { orders_count: ordersCount },
      });
    }

    await this.customersRepository.remove(customer);
  }
}
