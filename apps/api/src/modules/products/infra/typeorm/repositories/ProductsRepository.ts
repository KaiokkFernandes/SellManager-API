import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { Product } from '../../../domain/entities/Product';
import {
  ICreateProductDTO,
  IFindProductsFilter,
  IProductsRepository,
} from '../../../domain/repositories/IProductsRepository';
import { containsPattern } from '@shared/infra/typeorm/like';
import { ProductSchema } from '../schemas/ProductSchema';

export class ProductsRepository implements IProductsRepository {
  private readonly ormRepository: Repository<Product>;

  // EntityManager permite usar o repositório dentro de uma transação.
  constructor(connection: DataSource | EntityManager) {
    this.ormRepository = connection.getRepository(ProductSchema);
  }

  public async findAll(
    { search, sort = 'name', order = 'asc' }: IFindProductsFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Product>> {
    const query = this.ormRepository.createQueryBuilder('product');
    if (search) {
      query.where('product.name ILIKE :pattern', {
        pattern: containsPattern(search),
      });
    }
    const { skip, take } = toSkipTake(pagination);
    const [items, total] = await query
      .orderBy(`product.${sort}`, order === 'asc' ? 'ASC' : 'DESC')
      .addOrderBy('product.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { items, total };
  }

  public findById(id: string): Promise<Product | null> {
    return this.ormRepository.findOneBy({ id });
  }

  /** Sem diferenciar maiúsculas (o índice único é em lower(name)). */
  public findByName(name: string): Promise<Product | null> {
    return this.ormRepository
      .createQueryBuilder('product')
      .where('lower(product.name) = lower(:name)', { name })
      .getOne();
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
