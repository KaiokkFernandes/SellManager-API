import { randomUUID } from 'node:crypto';
import { Customer } from '../domain/entities/Customer';
import {
  ICreateCustomerDTO,
  ICustomersRepository,
} from '../domain/repositories/ICustomersRepository';

export class FakeCustomersRepository implements ICustomersRepository {
  public readonly customers: Customer[] = [];

  public findAll(): Promise<Customer[]> {
    return Promise.resolve(this.customers.map(customer => ({ ...customer })));
  }

  public findById(id: string): Promise<Customer | null> {
    const customer = this.customers.find(item => item.id === id);
    return Promise.resolve(customer ? { ...customer } : null);
  }

  public findByEmail(email: string): Promise<Customer | null> {
    const customer = this.customers.find(item => item.email === email);
    return Promise.resolve(customer ? { ...customer } : null);
  }

  public create(data: ICreateCustomerDTO): Promise<Customer> {
    const now = new Date();
    const customer: Customer = {
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      ...data,
    };
    this.customers.push(customer);
    return Promise.resolve({ ...customer });
  }

  public save(customer: Customer): Promise<Customer> {
    const index = this.customers.findIndex(item => item.id === customer.id);
    const saved = { ...customer, updated_at: new Date() };
    if (index >= 0) this.customers[index] = saved;
    else this.customers.push(saved);
    return Promise.resolve({ ...saved });
  }

  public remove(customer: Customer): Promise<void> {
    const index = this.customers.findIndex(item => item.id === customer.id);
    if (index >= 0) this.customers.splice(index, 1);
    return Promise.resolve();
  }
}
