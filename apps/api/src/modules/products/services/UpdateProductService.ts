import AppError from '@shared/errors/AppError';
import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

/** O estoque não muda aqui: só por movimentação (entrada/ajuste). */
interface IRequest {
  id: string;
  name: string;
  price: number;
}

export class UpdateProductService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute({ id, name, price }: IRequest): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const productWithName = await this.productsRepository.findByName(name);

    if (productWithName && productWithName.id !== id) {
      throw AppError.alreadyExists(
        'name',
        'There is already one product with this name',
      );
    }

    product.name = name;
    product.price = price;

    return this.productsRepository.save(product);
  }
}
