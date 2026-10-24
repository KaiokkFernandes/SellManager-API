import { Customer } from '../domain/entities/Customer';
import { ICustomersRepository } from '../domain/repositories/ICustomersRepository';

export class ListCustomersService {
  constructor(private readonly customersRepository: ICustomersRepository) {}

  public execute(): Promise<Customer[]> {
    return this.customersRepository.findAll();
  }
}
