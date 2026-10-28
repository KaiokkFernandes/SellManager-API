import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CategorySchema } from '@modules/categories/infra/typeorm/schemas/CategorySchema';
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
import { ProductRow, ProductSchema } from '../schemas/ProductSchema';

export class ProductsRepository implements IProductsRepository {
  private readonly ormRepository: Repository<ProductRow>;
  private readonly connection: DataSource | EntityManager;

  // EntityManager permite usar o repositório dentro de uma transação.
  constructor(connection: DataSource | EntityManager) {
    this.connection = connection;
    this.ormRepository = connection.getRepository(ProductSchema);
  }

  /**
   * Nome da categoria em uma consulta à parte (sem JOIN: o FOR UPDATE de
   * findByIdsForUpdate não pode travar o lado opcional de um outer join).
   */
  private async withCategories(rows: ProductRow[]): Promise<Product[]> {
    const ids = [...new Set(rows.flatMap(row => row.category_id ?? []))];
    const categories = ids.length
      ? await this.connection.getRepository(CategorySchema).find({
          select: { id: true, name: true },
          where: { id: In(ids) },
        })
      : [];
    const nameById = new Map(categories.map(({ id, name }) => [id, name]));

    return rows.map(row => ({
      ...row,
      category: row.category_id
        ? { id: row.category_id, name: nameById.get(row.category_id) ?? '' }
        : null,
    }));
  }

  private async one(row: ProductRow | null): Promise<Product | null> {
    return row ? ((await this.withCategories([row]))[0] ?? null) : null;
  }

  public async findAll(
    { search, category_id, sort = 'name', order = 'asc' }: IFindProductsFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Product>> {
    const query = this.ormRepository.createQueryBuilder('product');
    if (search) {
      query.andWhere('product.name ILIKE :pattern', {
        pattern: containsPattern(search),
      });
    }
    if (category_id) {
      query.andWhere('product.category_id = :category_id', { category_id });
    }
    const { skip, take } = toSkipTake(pagination);
    const [rows, total] = await query
      .orderBy(`product.${sort}`, order === 'asc' ? 'ASC' : 'DESC')
      .addOrderBy('product.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { items: await this.withCategories(rows), total };
  }

  public async findById(id: string): Promise<Product | null> {
    return this.one(await this.ormRepository.findOneBy({ id }));
  }

  /** Sem diferenciar maiúsculas (o índice único é em lower(name)). */
  public async findByName(name: string): Promise<Product | null> {
    return this.one(
      await this.ormRepository
        .createQueryBuilder('product')
        .where('lower(product.name) = lower(:name)', { name })
        .getOne(),
    );
  }

  public async findByIdsForUpdate(ids: string[]): Promise<Product[]> {
    const rows = await this.ormRepository.find({
      where: { id: In(ids) },
      // ordem fixa evita deadlock entre pedidos concorrentes
      order: { id: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
    return this.withCategories(rows);
  }

  public async create(data: ICreateProductDTO): Promise<Product> {
    const row = await this.ormRepository.save(
      this.ormRepository.create({ ...data, image: null }),
    );
    return (await this.withCategories([row]))[0];
  }

  public async save({
    category: _category,
    ...row
  }: Product): Promise<Product> {
    // a categoria vale pelo category_id; o resumo é recarregado
    return (await this.withCategories([await this.ormRepository.save(row)]))[0];
  }

  public async remove(product: Product): Promise<void> {
    await this.ormRepository.delete({ id: product.id });
  }
}
