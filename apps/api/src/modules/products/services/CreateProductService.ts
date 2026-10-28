import AppError from '@shared/errors/AppError';
import { Product } from '../domain/entities/Product';
import { IProductsUnitOfWork } from '../domain/repositories/IProductsUnitOfWork';
import { StockLedger } from '../domain/StockLedger';

interface IRequest {
  name: string;
  price: number;
  /** Estoque inicial: vira a movimentação INITIAL. */
  quantity: number;
  created_by: string;
}

export class CreateProductService {
  constructor(private readonly unitOfWork: IProductsUnitOfWork) {}

  public execute({
    name,
    price,
    quantity,
    created_by,
  }: IRequest): Promise<Product> {
    return this.unitOfWork.run(async ({ products, movements }) => {
      if (await products.findByName(name)) {
        throw AppError.alreadyExists(
          'name',
          'There is already one product with this name',
        );
      }

      // nasce zerado: o saldo só muda pelo livro de estoque
      const product = await products.create({ name, price, quantity: 0 });
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
