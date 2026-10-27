import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { CreateCustomerService } from '../../../services/CreateCustomerService';
import { DeleteCustomerService } from '../../../services/DeleteCustomerService';
import { ListCustomersService } from '../../../services/ListCustomersService';
import { ShowCustomerService } from '../../../services/ShowCustomerService';
import { UpdateCustomerService } from '../../../services/UpdateCustomerService';
import { toCustomerResponse } from '../CustomerMapper';

interface CustomersServices {
  list: ListCustomersService;
  show: ShowCustomerService;
  create: CreateCustomerService;
  update: UpdateCustomerService;
  delete: DeleteCustomerService;
}

type Routes = typeof routes.customers;

export class CustomersController {
  constructor(private readonly services: CustomersServices) {}

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { page, limit, q, sort, order } = input.query;
    const { data, meta } = await this.services.list.execute(
      { search: q, sort, order },
      { page, limit },
    );
    reply(200, { data: data.map(toCustomerResponse), meta });
  };

  public show: RouteHandler<Routes['show']> = async ({ input, reply }) => {
    const customer = await this.services.show.execute({ id: input.params.id });
    reply(200, toCustomerResponse(customer));
  };

  public create: RouteHandler<Routes['create']> = async ({ input, reply }) => {
    const customer = await this.services.create.execute(input.body);
    reply(201, toCustomerResponse(customer));
  };

  public update: RouteHandler<Routes['update']> = async ({ input, reply }) => {
    const customer = await this.services.update.execute({
      id: input.params.id,
      ...input.body,
    });
    reply(200, toCustomerResponse(customer));
  };

  public delete: RouteHandler<Routes['delete']> = async ({ input, reply }) => {
    await this.services.delete.execute({ id: input.params.id });
    reply(204);
  };
}
