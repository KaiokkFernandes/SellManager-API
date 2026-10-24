import { Request, Response } from 'express';
import { CreateCustomerService } from '../../../services/CreateCustomerService';
import { DeleteCustomerService } from '../../../services/DeleteCustomerService';
import { ListCustomersService } from '../../../services/ListCustomersService';
import { ShowCustomerService } from '../../../services/ShowCustomerService';
import { UpdateCustomerService } from '../../../services/UpdateCustomerService';
import { CustomerBody } from '../schemas';

interface CustomersServices {
  list: ListCustomersService;
  show: ShowCustomerService;
  create: CreateCustomerService;
  update: UpdateCustomerService;
  delete: DeleteCustomerService;
}

export class CustomersController {
  constructor(private readonly services: CustomersServices) {}

  public index = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    response.json(await this.services.list.execute());
  };

  public show = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    response.json(await this.services.show.execute({ id: request.params.id }));
  };

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const customer = await this.services.create.execute(
      request.body as CustomerBody,
    );
    response.status(201).json(customer);
  };

  public update = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    const customer = await this.services.update.execute({
      id: request.params.id,
      ...(request.body as CustomerBody),
    });
    response.json(customer);
  };

  public delete = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    await this.services.delete.execute({ id: request.params.id });
    response.status(204).send();
  };
}
