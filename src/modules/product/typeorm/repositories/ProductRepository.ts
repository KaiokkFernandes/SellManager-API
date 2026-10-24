import { Repository } from 'typeorm';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import Product from '../entities/Product';

interface ICreateProduct {
  name: string;
  price: number;
  quantity: number;
}

export class ProductRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = AppDataSource.getRepository(Product);
  }

  public async findAll(): Promise<Product[]> {
    return this.ormRepository.find();
  }

  public async findById(id: string): Promise<Product | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public async findByName(name: string): Promise<Product | null> {
    return this.ormRepository.findOneBy({ name });
  }

  public async create(data: ICreateProduct): Promise<Product> {
    const product = this.ormRepository.create(data);
    return this.ormRepository.save(product);
  }

  public async save(product: Product): Promise<Product> {
    return this.ormRepository.save(product);
  }

  public async remove(product: Product): Promise<void> {
    await this.ormRepository.remove(product);
  }
}

export default ProductRepository;
