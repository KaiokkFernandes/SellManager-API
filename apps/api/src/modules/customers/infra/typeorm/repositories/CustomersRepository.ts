import { DataSource, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { Customer } from '../../../domain/entities/Customer';
import {
  ICreateCustomerDTO,
  ICustomersRepository,
  IFindCustomersFilter,
} from '../../../domain/repositories/ICustomersRepository';
import { containsPattern } from '@shared/infra/typeorm/like';
import { CustomerSchema } from '../schemas/CustomerSchema';

export class CustomersRepository implements ICustomersRepository {
  private readonly ormRepository: Repository<Customer>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(CustomerSchema);
  }

  public async findAll(
    { search, sort = 'name', order = 'asc' }: IFindCustomersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Customer>> {
    const query = this.ormRepository.createQueryBuilder('customer');
    if (search) {
      query.where(
        '(customer.name ILIKE :pattern OR customer.email ILIKE :pattern)',
        { pattern: containsPattern(search) },
      );
    }
    const { skip, take } = toSkipTake(pagination);
    const [items, total] = await query
      .orderBy(`customer.${sort}`, order === 'asc' ? 'ASC' : 'DESC')
      .addOrderBy('customer.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { items, total };
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
