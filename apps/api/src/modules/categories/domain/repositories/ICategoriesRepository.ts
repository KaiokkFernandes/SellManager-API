import { PageResult, PaginationParams } from '@shared/domain/pagination';
import { Category } from '../entities/Category';

export interface IFindCategoriesFilter {
  search?: string;
}

export interface ICategoriesRepository {
  /** Ordenadas por nome. */
  findAll(
    filter: IFindCategoriesFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Category>>;
  findById(id: string): Promise<Category | null>;
  /** Busca pelo nome sem diferenciar maiúsculas. */
  findByName(name: string): Promise<Category | null>;
  create(data: { name: string }): Promise<Category>;
  save(category: Category): Promise<Category>;
  remove(category: Category): Promise<void>;
}
