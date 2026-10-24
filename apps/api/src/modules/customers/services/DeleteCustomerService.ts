import AppError from '@shared/errors/AppError';
import { ICustomersRepository } from '../domain/repositories/ICustomersRepository';

export class DeleteCustomerService {
  constructor(private readonly customersRepository: ICustomersRepository) {}

  public async execute({ id }: { id: string }): Promise<void> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    await this.customersRepository.remove(customer);
  }
}
