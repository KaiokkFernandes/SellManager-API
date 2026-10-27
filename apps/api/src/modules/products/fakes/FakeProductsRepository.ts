import { randomUUID } from 'node:crypto';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { matchesSearch, sortInMemory } from '@shared/domain/listing';
import { Product } from '../domain/entities/Product';
import {
  ICreateProductDTO,
  IFindProductsFilter,
  IProductsRepository,
} from '../domain/repositories/IProductsRepository';

export class FakeProductsRepository implements IProductsRepository {
  public readonly products: Product[] = [];

  public findAll(
    { search, sort = 'name', order }: IFindProductsFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Product>> {
    const found = this.products.filter(product =>
      matchesSearch(search, product.name),
    );
    return Promise.resolve(
      slicePage(
        sortInMemory(found, product => product[sort], order).map(product => ({
          ...product,
        })),
        pagination,
      ),
    );
  }

  public findById(id: string): Promise<Product | null> {
    const product = this.products.find(item => item.id === id);
    return Promise.resolve(product ? { ...product } : null);
  }

  public findByName(name: string): Promise<Product | null> {
    const product = this.products.find(
      item => item.name.toLowerCase() === name.toLowerCase(),
    );
    return Promise.resolve(product ? { ...product } : null);
  }

  public findByIdsForUpdate(ids: string[]): Promise<Product[]> {
    return Promise.resolve(
      this.products
        .filter(product => ids.includes(product.id))
        .map(product => ({ ...product })),
    );
  }

  public create(data: ICreateProductDTO): Promise<Product> {
    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      image: null,
      ...data,
    };
    this.products.push(product);
    return Promise.resolve({ ...product });
  }

  public save(product: Product): Promise<Product> {
    const index = this.products.findIndex(item => item.id === product.id);
    const saved = { ...product, updated_at: new Date() };
    if (index >= 0) this.products[index] = saved;
    else this.products.push(saved);
    return Promise.resolve({ ...saved });
  }

  public remove(product: Product): Promise<void> {
    const index = this.products.findIndex(item => item.id === product.id);
    if (index >= 0) this.products.splice(index, 1);
    return Promise.resolve();
  }
}
