import AppError from '@shared/errors/AppError';
import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

export class ShowProductService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute({ id }: { id: string }): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }
}
