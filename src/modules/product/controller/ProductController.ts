import { Request, Response } from 'express';
import ListProductService from '../service/ListProductService';
import ShowProductService from '../service/ShowProductService';
import CreateProducService from '../service/CreateProductService';
import UpdateProductService from '../service/updateProductService';
import DeleteProductService from '../service/DeleteProductService';

export default class ProductController {
   public async index(_request: Request, response: Response): Promise<Response>{
    const listProducts = new ListProductService();

    const products = await listProducts.execute();

    return response.json(products);
   }

   public async show(request: Request, response: Response): Promise<Response>{
    const {id} = request.params;

    const showProduct = new ShowProductService();

    const product = await showProduct.execute({id});

    return response.json(product);
   }

   public async create(request: Request, response: Response){
    const {name, price, quantity} = request.body;

    const createProduct = new CreateProducService();

    const product = await createProduct.execute({name, price, quantity});

    return response.json(product);
   }

   public async update(request: Request, response: Response): Promise<Response>{
     const {name, price, quantity} = request.body;
     const {id} = request.params;

     const updateProduct = new UpdateProductService();

     const product = await updateProduct.execute({id, name, price, quantity});

     return response.json(product);
   }

   public async delete(request: Request, response: Response): Promise<Response>{
      const {id} = request.params;

      const deleteProduct = new DeleteProductService();

      await deleteProduct.execute({id});

      return response.json([]);
   }

}
