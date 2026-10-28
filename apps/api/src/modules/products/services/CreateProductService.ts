import type { ICategoriesRepository } from '@modules/categories/domain/repositories/ICategoriesRepository';
import AppError from '@shared/errors/AppError';
import { Product } from '../domain/entities/Product';
import { IProductsUnitOfWork } from '../domain/repositories/IProductsUnitOfWork';
import { StockLedger } from '../domain/StockLedger';

interface IRequest {
  name: string;
  price: number;
  /** Estoque inicial: vira a movimentação INITIAL. */
  quantity: number;
  category_id?: string | null;
  min_stock?: number;
  created_by: string;
}

export class CreateProductService {
  constructor(
    private readonly unitOfWork: IProductsUnitOfWork,
    private readonly categoriesRepository: Pick<
      ICategoriesRepository,
      'findById'
    >,
  ) {}

  public async execute({
    name,
    price,
    quantity,
    category_id = null,
    min_stock = 0,
    created_by,
  }: IRequest): Promise<Product> {
    await assertCategoryExists(this.categoriesRepository, category_id);

    return this.unitOfWork.run(async ({ products, movements }) => {
      if (await products.findByName(name)) {
        throw AppError.alreadyExists(
          'name',
          'There is already one product with this name',
        );
      }

      // nasce zerado: o saldo só muda pelo livro de estoque
      const product = await products.create({
        name,
        price,
        quantity: 0,
        category_id,
        min_stock,
      });
      if (quantity > 0) {
        await new StockLedger(products, movements).move(product, {
          type: 'INITIAL',
          quantity,
          created_by,
        });
      }
      return product;
    });
  }
}

/** Categoria informada precisa existir (null = sem categoria). */
export async function assertCategoryExists(
  categories: Pick<ICategoriesRepository, 'findById'>,
  categoryId: string | null,
): Promise<void> {
  if (categoryId && !(await categories.findById(categoryId))) {
    throw new AppError('Category not found', 404, {
      details: { category_id: categoryId },
    });
  }
}
