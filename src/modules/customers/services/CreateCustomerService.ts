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
      throw new AppError('Email address already used.', 409);
    }

    return this.customersRepository.create({ name, email });
  }
}
