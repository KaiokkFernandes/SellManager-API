import AppError from '@shared/errors/AppError';
import { Customer } from '../domain/entities/Customer';
import { ICustomersRepository } from '../domain/repositories/ICustomersRepository';

export class ShowCustomerService {
  constructor(private readonly customersRepository: ICustomersRepository) {}

  public async execute({ id }: { id: string }): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }
}
