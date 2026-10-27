import { Product } from '../entities/Product';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateProductDTO {
  name: string;
  price: number;
  quantity: number;
}

export interface IProductsRepository {
  findAll(pagination: PaginationParams): Promise<PageResult<Product>>;
  findById(id: string): Promise<Product | null>;
  /** Busca pelo nome sem diferenciar maiúsculas. */
  findByName(name: string): Promise<Product | null>;
  /** Busca e trava os produtos até o fim da unidade de trabalho atual. */
  findByIdsForUpdate(ids: string[]): Promise<Product[]>;
  create(data: ICreateProductDTO): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(product: Product): Promise<void>;
}
