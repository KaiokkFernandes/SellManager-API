import { Repository } from 'typeorm';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import Customer from '../entities/Customers';

interface ICreateCustomer {
  name: string;
  email: string;
}

class CustomerRepository {
  private ormRepository: Repository<Customer>;

  constructor() {
    this.ormRepository = AppDataSource.getRepository(Customer);
  }

  public async findAll(): Promise<Customer[]> {
    return this.ormRepository.find();
  }

  public async findById(id: string): Promise<Customer | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public async findByEmail(email: string): Promise<Customer | null> {
    return this.ormRepository.findOneBy({ email });
  }

  public async create(data: ICreateCustomer): Promise<Customer> {
    const customer = this.ormRepository.create(data);
    return this.ormRepository.save(customer);
  }

  public async save(customer: Customer): Promise<Customer> {
    return this.ormRepository.save(customer);
  }

  public async remove(customer: Customer): Promise<void> {
    await this.ormRepository.remove(customer);
  }
}

export default CustomerRepository;
