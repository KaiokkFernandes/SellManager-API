import type { ICategoriesRepository } from '@modules/categories/domain/repositories/ICategoriesRepository';
import AppError from '@shared/errors/AppError';
import { assertCategoryExists } from './CreateProductService';
import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

/** O estoque não muda aqui: só por movimentação (entrada/ajuste). */
interface IRequest {
  id: string;
  name: string;
  price: number;
  category_id?: string | null;
  min_stock?: number;
}

export class UpdateProductService {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly categoriesRepository: Pick<
      ICategoriesRepository,
      'findById'
    >,
  ) {}

  public async execute({
    id,
    name,
    price,
    category_id = null,
    min_stock = 0,
  }: IRequest): Promise<Product> {
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

    await assertCategoryExists(this.categoriesRepository, category_id);

    product.name = name;
    product.category_id = category_id;
    product.min_stock = min_stock;
    product.price = price;

    return this.productsRepository.save(product);
  }
}
