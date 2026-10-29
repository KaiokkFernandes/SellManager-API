import { randomUUID } from 'node:crypto';
import { matchesSearch, sortInMemory } from '@shared/domain/listing';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { Category } from '../domain/entities/Category';
import {
  ICategoriesRepository,
  IFindCategoriesFilter,
} from '../domain/repositories/ICategoriesRepository';

export class FakeCategoriesRepository implements ICategoriesRepository {
  public readonly categories: Omit<Category, 'products_count'>[] = [];

  /** Quantos produtos usam a categoria (os testes ligam ao fake de produtos). */
  constructor(
    private readonly countProducts: (categoryId: string) => number = () => 0,
  ) {}

  private withCount(category: Omit<Category, 'products_count'>): Category {
    return { ...category, products_count: this.countProducts(category.id) };
  }

  public findAll(
    { search }: IFindCategoriesFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Category>> {
    const found = this.categories.filter(category =>
      matchesSearch(search, category.name),
    );
    return Promise.resolve(
      slicePage(
        sortInMemory(found, category => category.name).map(category =>
          this.withCount(category),
        ),
        pagination,
      ),
    );
  }

  public findById(id: string): Promise<Category | null> {
    const category = this.categories.find(item => item.id === id);
    return Promise.resolve(category ? this.withCount(category) : null);
  }

  public findByName(name: string): Promise<Category | null> {
    const category = this.categories.find(
      item => item.name.toLowerCase() === name.toLowerCase(),
    );
    return Promise.resolve(category ? this.withCount(category) : null);
  }

  public create({ name }: { name: string }): Promise<Category> {
    const now = new Date();
    const category = {
      id: randomUUID(),
      name,
      created_at: now,
      updated_at: now,
    };
    this.categories.push(category);
    return Promise.resolve(this.withCount(category));
  }

  public save({ products_count: _count, ...category }: Category) {
    const index = this.categories.findIndex(item => item.id === category.id);
    const saved = { ...category, updated_at: new Date() };
    this.categories[index] = saved;
    return Promise.resolve(this.withCount(saved));
  }

  public remove(category: Category): Promise<void> {
    const index = this.categories.findIndex(item => item.id === category.id);
    this.categories.splice(index, 1);
    return Promise.resolve();
  }
}
