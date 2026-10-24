import { Request, Response } from 'express';
import { ProductBody } from '../routes/products.schemas';
import ListProductService from '../service/ListProductService';
import ShowProductService from '../service/ShowProductService';
import CreateProducService from '../service/CreateProductService';
import UpdateProductService from '../service/updateProductService';
import DeleteProductService from '../service/DeleteProductService';

export default class ProductController {
  public async index(_request: Request, response: Response): Promise<void> {
    const listProducts = new ListProductService();

    const products = await listProducts.execute();

    response.json(products);
  }

  public async show(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    const showProduct = new ShowProductService();

    const product = await showProduct.execute({ id });

    response.json(product);
  }

  public async create(request: Request, response: Response): Promise<void> {
    const { name, price, quantity } = request.body as ProductBody;

    const createProduct = new CreateProducService();

    const product = await createProduct.execute({ name, price, quantity });

    response.json(product);
  }

  public async update(request: Request, response: Response): Promise<void> {
    const { name, price, quantity } = request.body as ProductBody;
    const { id } = request.params;

    const updateProduct = new UpdateProductService();

    const product = await updateProduct.execute({ id, name, price, quantity });

    response.json(product);
  }

  public async delete(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    const deleteProduct = new DeleteProductService();

    await deleteProduct.execute({ id });

    response.json([]);
  }
}
