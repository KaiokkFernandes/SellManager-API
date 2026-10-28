import AppError from '@shared/errors/AppError';
import { Category } from '../domain/entities/Category';
import { ICategoriesRepository } from '../domain/repositories/ICategoriesRepository';

export class CreateCategoryService {
  constructor(private readonly categoriesRepository: ICategoriesRepository) {}

  public async execute({ name }: { name: string }): Promise<Category> {
    if (await this.categoriesRepository.findByName(name)) {
      throw AppError.alreadyExists(
        'name',
        'There is already one category with this name',
      );
    }

    return this.categoriesRepository.create({ name });
  }
}
