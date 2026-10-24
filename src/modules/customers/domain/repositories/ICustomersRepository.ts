import { Customer } from '../entities/Customer';

export interface ICreateCustomerDTO {
  name: string;
  email: string;
}

export interface ICustomersRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(data: ICreateCustomerDTO): Promise<Customer>;
  save(customer: Customer): Promise<Customer>;
  remove(customer: Customer): Promise<void>;
}
