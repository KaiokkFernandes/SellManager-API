import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { Product } from '../../../domain/entities/Product';
import {
  ICreateProductDTO,
  IProductsRepository,
} from '../../../domain/repositories/IProductsRepository';
import { ProductSchema } from '../schemas/ProductSchema';

export class ProductsRepository implements IProductsRepository {
  private readonly ormRepository: Repository<Product>;

  // EntityManager permite usar o repositório dentro de uma transação.
  constructor(connection: DataSource | EntityManager) {
    this.ormRepository = connection.getRepository(ProductSchema);
  }

  public async findAll(
    pagination: PaginationParams,
  ): Promise<PageResult<Product>> {
    const [items, total] = await this.ormRepository.findAndCount({
      order: { name: 'ASC', id: 'ASC' },
      ...toSkipTake(pagination),
    });
    return { items, total };
  }

  public findById(id: string): Promise<Product | null> {
    return this.ormRepository.findOneBy({ id });
  }

  public findByName(name: string): Promise<Product | null> {
    return this.ormRepository.findOneBy({ name });
  }

  public findByIdsForUpdate(ids: string[]): Promise<Product[]> {
    return this.ormRepository.find({
      where: { id: In(ids) },
      // ordem fixa evita deadlock entre pedidos concorrentes
      order: { id: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
  }

  public create(data: ICreateProductDTO): Promise<Product> {
    return this.ormRepository.save(this.ormRepository.create(data));
  }

  public save(product: Product): Promise<Product> {
    return this.ormRepository.save(product);
  }

  public async remove(product: Product): Promise<void> {
    await this.ormRepository.delete({ id: product.id });
  }
}
