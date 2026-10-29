import AppError from '@shared/errors/AppError';
import { ICategoriesRepository } from '../domain/repositories/ICategoriesRepository';

export class DeleteCategoryService {
  constructor(private readonly categoriesRepository: ICategoriesRepository) {}

  public async execute({ id }: { id: string }): Promise<void> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // produtos não ficam órfãos sem querer (a FK RESTRICT é a rede de segurança)
    if (category.products_count > 0) {
      throw new AppError('Category has products and cannot be deleted', 409, {
        code: 'RESOURCE_IN_USE',
        details: { products_count: category.products_count },
      });
    }

    await this.categoriesRepository.remove(category);
  }
}
