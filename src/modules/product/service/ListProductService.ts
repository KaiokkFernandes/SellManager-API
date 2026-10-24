import ProductRepository from '../typeorm/repositories/ProductRepository';
import Product from '../typeorm/entities/Product';

class ListProductService {
  public async execute(): Promise<Product[]> {
    const productRepository = new ProductRepository();

    const products = await productRepository.findAll();

    return products;
  }
}

export default ListProductService;
