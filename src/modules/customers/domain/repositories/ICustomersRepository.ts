import { Customer } from '../entities/Customer';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateCustomerDTO {
  name: string;
  email: string;
}

export interface ICustomersRepository {
  findAll(pagination: PaginationParams): Promise<PageResult<Customer>>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(data: ICreateCustomerDTO): Promise<Customer>;
  save(customer: Customer): Promise<Customer>;
  remove(customer: Customer): Promise<void>;
}
