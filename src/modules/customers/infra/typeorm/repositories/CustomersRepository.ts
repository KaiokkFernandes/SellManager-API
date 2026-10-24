import { DataSource, Repository } from 'typeorm';
import { Customer } from '../../../domain/entities/Customer';
import {
  ICreateCustomerDTO,
  ICustomersRepository,
} from '../../../domain/repositories/ICustomersRepository';
import { CustomerSchema } from '../schemas/CustomerSchema';

export class CustomersRepository implements ICustomersRepository {
  private readonly ormRepository: Repository<Customer>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CustomerSchema);
  }

  public findAll(): Promise<Customer[]> {
    return this.ormRepository.find({ order: { name: 'ASC' } });
  }

  public findById(id: string): Promise<Customer | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public findByEmail(email: string): Promise<Customer | null> {
    return this.ormRepository.findOneBy({ email });
  }

  public create(data: ICreateCustomerDTO): Promise<Customer> {
    return this.ormRepository.save(this.ormRepository.create(data));
  }

  public save(customer: Customer): Promise<Customer> {
    return this.ormRepository.save(customer);
  }

  public async remove(customer: Customer): Promise<void> {
    await this.ormRepository.delete({ id: customer.id });
  }
}
