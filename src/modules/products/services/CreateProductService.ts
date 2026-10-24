import AppError from '@shared/errors/AppError';
import { Product } from '../domain/entities/Product';
import {
  ICreateProductDTO,
  IProductsRepository,
} from '../domain/repositories/IProductsRepository';

export class CreateProductService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public async execute({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    if (await this.productsRepository.findByName(name)) {
      throw new AppError('There is already one product with this name', 409);
    }

    return this.productsRepository.create({ name, price, quantity });
  }
}
