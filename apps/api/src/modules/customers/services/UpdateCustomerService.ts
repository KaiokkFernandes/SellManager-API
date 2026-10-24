import AppError from '@shared/errors/AppError';
import { Customer } from '../domain/entities/Customer';
import {
  ICreateCustomerDTO,
  ICustomersRepository,
} from '../domain/repositories/ICustomersRepository';

interface IRequest extends ICreateCustomerDTO {
  id: string;
}

export class UpdateCustomerService {
  constructor(private readonly customersRepository: ICustomersRepository) {}

  public async execute({ id, name, email }: IRequest): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const customerWithEmail = await this.customersRepository.findByEmail(email);

    if (customerWithEmail && customerWithEmail.id !== id) {
      throw new AppError('Email already in use', 409);
    }

    customer.name = name;
    customer.email = email;

    return this.customersRepository.save(customer);
  }
}
