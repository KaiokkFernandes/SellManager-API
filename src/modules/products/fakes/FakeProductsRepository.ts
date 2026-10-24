import { randomUUID } from 'node:crypto';
import {
  PageResult,
  PaginationParams,
  slicePage,
} from '@shared/domain/pagination';
import { Product } from '../domain/entities/Product';
import {
  ICreateProductDTO,
  IProductsRepository,
} from '../domain/repositories/IProductsRepository';

export class FakeProductsRepository implements IProductsRepository {
  public readonly products: Product[] = [];

  public findAll(pagination: PaginationParams): Promise<PageResult<Product>> {
    return Promise.resolve(
      slicePage(
        this.products.map(product => ({ ...product })),
        pagination,
      ),
    );
  }

  public findById(id: string): Promise<Product | null> {
    const product = this.products.find(item => item.id === id);
    return Promise.resolve(product ? { ...product } : null);
  }

  public findByName(name: string): Promise<Product | null> {
    const product = this.products.find(item => item.name === name);
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
