import { Request, Response } from 'express';
import ListCostumerServices from '../services/ListCutomersServices';
import ShowCostumerServices from '../services/ShowCustomerService';
import UpdateCostumerService from '../services/UpdateCostumerService';
import DeleteCostumerService from '../services/DeleteCostumerService';
import CreateCustomerService from '../services/CreateCustomerService';

export default class CustomerController {
   public async index(_request: Request, response: Response): Promise<Response>{
    const listCostumers = new ListCostumerServices();

    const products = await listCostumers.execute();

    return response.json(products);
   }

   public async show(request: Request, response: Response): Promise<Response>{
    const {id} = request.params;

    const showCostumer = new ShowCostumerServices();

    const product = await showCostumer.execute({id});

    return response.json(product);
   }

   public async create(request: Request, response: Response){
    const {name, email} = request.body;

    const createProduct = new CreateCustomerService();

    const costumer = await createProduct.execute({name, email});

    return response.json(costumer);
   }

   public async update(request: Request, response: Response): Promise<Response>{
     const {name, email } = request.body;
     const {id} = request.params;

     const updateCostumer = new UpdateCostumerService();

     const costumer = await updateCostumer.execute({id, name, email});

     return response.json(costumer);
   }

   public async delete(request: Request, response: Response): Promise<Response>{
      const {id} = request.params;

      const deleteCostumer = new DeleteCostumerService()
      ;

      await deleteCostumer.execute({id});

      return response.json([]);
   }

}
