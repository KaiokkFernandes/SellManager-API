import AppError from '@shared/errors/AppError';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

export class DeleteProductService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute({ id }: { id: string }): Promise<void> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await this.productsRepository.remove(product);
  }
}
