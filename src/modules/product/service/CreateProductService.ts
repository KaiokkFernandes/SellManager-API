import ProductRepository from '../typeorm/repositories/ProductRepository';
import AppError from '@shared/erros/AppError';

interface IProduct {
  name: string;
  price: number;
  quantity: number;
}

class CreateProducService {
  public async execute({ name, price, quantity }: IProduct): Promise<IProduct> {
    const productRepository = new ProductRepository();

    const productExists = await productRepository.findByName(name);

    if (productExists) {
      throw new AppError('There is already one product with this name');
    }

    const product = await productRepository.create({
      name,
      price,
      quantity,
    });
    return product;
  }
}
export default CreateProducService;
