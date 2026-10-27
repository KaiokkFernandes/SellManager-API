import AppError from '@shared/errors/AppError';
import { Customer } from '../domain/entities/Customer';
import {
  ICreateCustomerDTO,
  ICustomersRepository,
} from '../domain/repositories/ICustomersRepository';

export class CreateCustomerService {
  constructor(private readonly customersRepository: ICustomersRepository) {}

  public async execute({ name, email }: ICreateCustomerDTO): Promise<Customer> {
    if (await this.customersRepository.findByEmail(email)) {
      throw AppError.alreadyExists('email', 'Email already in use');
    }

    return this.customersRepository.create({ name, email });
  }
}
