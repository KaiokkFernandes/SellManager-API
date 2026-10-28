import { Product } from '../entities/Product';
import type { ProductSort } from '@sellmanager/shared';
import type { IListFilter } from '@shared/domain/listing';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateProductDTO {
  name: string;
  price: number;
  quantity: number;
  category_id?: string | null;
}

/** Busca no nome e filtro por categoria; padrão: nome ascendente. */
export interface IFindProductsFilter extends IListFilter<ProductSort> {
  category_id?: string;
}

export interface IProductsRepository {
  findAll(
    filter: IFindProductsFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Product>>;
  findById(id: string): Promise<Product | null>;
  /** Busca pelo nome sem diferenciar maiúsculas. */
  findByName(name: string): Promise<Product | null>;
  /** Busca e trava os produtos até o fim da unidade de trabalho atual. */
  findByIdsForUpdate(ids: string[]): Promise<Product[]>;
  create(data: ICreateProductDTO): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(product: Product): Promise<void>;
}
