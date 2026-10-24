import AppError from '@shared/errors/AppError';
import { Product } from '../domain/entities/Product';
import {
  ICreateProductDTO,
  IProductsRepository,
} from '../domain/repositories/IProductsRepository';

interface IRequest extends ICreateProductDTO {
  id: string;
}

export class UpdateProductService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute({
    id,
    name,
    price,
    quantity,
  }: IRequest): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const productWithName = await this.productsRepository.findByName(name);

    if (productWithName && productWithName.id !== id) {
      throw new AppError('There is already one product with this name', 409);
    }

    product.name = name;
    product.price = price;
    product.quantity = quantity;

    return this.productsRepository.save(product);
  }
}
