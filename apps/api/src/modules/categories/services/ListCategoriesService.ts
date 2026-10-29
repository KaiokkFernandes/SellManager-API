import {
  DEFAULT_PAGINATION,
  paginate,
  Paginated,
  PaginationParams,
} from '@shared/domain/pagination';
import { Category } from '../domain/entities/Category';
import {
  ICategoriesRepository,
  IFindCategoriesFilter,
} from '../domain/repositories/ICategoriesRepository';

export class ListCategoriesService {
  constructor(private readonly categoriesRepository: ICategoriesRepository) {}

  public async execute(
    filter: IFindCategoriesFilter = {},
    pagination: PaginationParams = DEFAULT_PAGINATION,
  ): Promise<Paginated<Category>> {
    return paginate(
      await this.categoriesRepository.findAll(filter, pagination),
      pagination,
    );
  }
}
