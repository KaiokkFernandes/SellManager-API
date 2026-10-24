import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

export class ListProductsService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  public execute(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }
}
