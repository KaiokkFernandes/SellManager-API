import AppError from '@shared/errors/AppError';
import { Category } from '../domain/entities/Category';
import { ICategoriesRepository } from '../domain/repositories/ICategoriesRepository';

export class UpdateCategoryService {
  constructor(private readonly categoriesRepository: ICategoriesRepository) {}

  public async execute({
    id,
    name,
  }: {
    id: string;
    name: string;
  }): Promise<Category> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const withName = await this.categoriesRepository.findByName(name);
    if (withName && withName.id !== id) {
      throw AppError.alreadyExists(
        'name',
        'There is already one category with this name',
      );
    }

    category.name = name;
    return this.categoriesRepository.save(category);
  }
}
