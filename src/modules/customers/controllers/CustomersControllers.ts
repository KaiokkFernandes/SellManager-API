import { Request, Response } from 'express';
import { CustomerBody } from '../routes/customers.schemas';
import ListCostumerServices from '../services/ListCutomersServices';
import ShowCostumerServices from '../services/ShowCustomerService';
import UpdateCostumerService from '../services/UpdateCostumerService';
import DeleteCostumerService from '../services/DeleteCostumerService';
import CreateCustomerService from '../services/CreateCustomerService';

export default class CustomerController {
  public async index(_request: Request, response: Response): Promise<void> {
    const listCostumers = new ListCostumerServices();

    const products = await listCostumers.execute();

    response.json(products);
  }

  public async show(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    const showCostumer = new ShowCostumerServices();

    const product = await showCostumer.execute({ id });

    response.json(product);
  }

  public async create(request: Request, response: Response): Promise<void> {
    const { name, email } = request.body as CustomerBody;

    const createProduct = new CreateCustomerService();

    const costumer = await createProduct.execute({ name, email });

    response.json(costumer);
  }

  public async update(request: Request, response: Response): Promise<void> {
    const { name, email } = request.body as CustomerBody;
    const { id } = request.params;

    const updateCostumer = new UpdateCostumerService();

    const costumer = await updateCostumer.execute({ id, name, email });

    response.json(costumer);
  }

  public async delete(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    const deleteCostumer = new DeleteCostumerService();

    await deleteCostumer.execute({ id });

    response.json([]);
  }
}
