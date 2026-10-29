import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { containsPattern } from '@shared/infra/typeorm/like';
import { Category } from '../../../domain/entities/Category';
import {
  ICategoriesRepository,
  IFindCategoriesFilter,
} from '../../../domain/repositories/ICategoriesRepository';
import { CategoryRow, CategorySchema } from '../schemas/CategorySchema';

export class CategoriesRepository implements ICategoriesRepository {
  private readonly ormRepository: Repository<CategoryRow>;

  constructor(private readonly connection: DataSource | EntityManager) {
    this.ormRepository = connection.getRepository(CategorySchema);
  }

  /** Contagem de produtos da página inteira em uma consulta. */
  private async withCounts(rows: CategoryRow[]): Promise<Category[]> {
    if (rows.length === 0) return [];
    const counts = await this.connection.query<
      { category_id: string; count: number }[]
    >(
      'SELECT category_id, count(*)::int AS count FROM products WHERE category_id = ANY($1) GROUP BY category_id',
      [rows.map(row => row.id)],
    );
    const countById = new Map(
      counts.map(({ category_id, count }) => [category_id, count]),
    );
    return rows.map(row => ({
      ...row,
      products_count: countById.get(row.id) ?? 0,
    }));
  }

  private async one(row: CategoryRow | null): Promise<Category | null> {
    return row ? ((await this.withCounts([row]))[0] ?? null) : null;
  }

  public async findAll(
    { search }: IFindCategoriesFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Category>> {
    const query = this.ormRepository.createQueryBuilder('category');
    if (search) {
      query.where('category.name ILIKE :pattern', {
        pattern: containsPattern(search),
      });
    }
    const { skip, take } = toSkipTake(pagination);
    const [rows, total] = await query
      .orderBy('lower(category.name)', 'ASC')
      .addOrderBy('category.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { items: await this.withCounts(rows), total };
  }

  public async findById(id: string): Promise<Category | null> {
    return this.one(await this.ormRepository.findOneBy({ id }));
  }

  public async findByName(name: string): Promise<Category | null> {
    return this.one(
      await this.ormRepository
        .createQueryBuilder('category')
        .where('lower(category.name) = lower(:name)', { name })
        .getOne(),
    );
  }

  public async create({ name }: { name: string }): Promise<Category> {
    const row = await this.ormRepository.save(
      this.ormRepository.create({ name }),
    );
    return { ...row, products_count: 0 };
  }

  public async save({
    products_count,
    ...category
  }: Category): Promise<Category> {
    return { ...(await this.ormRepository.save(category)), products_count };
  }

  public async remove(category: Category): Promise<void> {
    await this.ormRepository.delete({ id: category.id });
  }
}
