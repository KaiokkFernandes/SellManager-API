import ProductRepository from '../typeorm/repositories/ProductRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: string;
}

class DeleteProductService {
  public async execute({ id }: IRequest): Promise<void> {
    const productRepository = new ProductRepository();

    const product = await productRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found');
    }

    await productRepository.remove(product);
  }
}

export default DeleteProductService;
