import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { CreateOrderService } from '../../../services/CreateOrderService';
import { ListOrdersService } from '../../../services/ListOrdersService';
import { ShowOrderService } from '../../../services/ShowOrderService';
import { UpdateOrderStatusService } from '../../../services/UpdateOrderStatusService';
import { toOrderResponse } from '../OrderMapper';

interface OrdersServices {
  list: ListOrdersService;
  show: ShowOrderService;
  create: CreateOrderService;
  updateStatus: UpdateOrderStatusService;
}

type Routes = typeof routes.orders;

export class OrdersController {
  constructor(private readonly services: OrdersServices) {}

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { customer_id, page, limit } = input.query;
    const { data, meta } = await this.services.list.execute(
      { customer_id },
      { page, limit },
    );
    reply(200, { data: data.map(toOrderResponse), meta });
  };

  public show: RouteHandler<Routes['show']> = async ({ input, reply }) => {
    const order = await this.services.show.execute({ id: input.params.id });
    reply(200, toOrderResponse(order));
  };

  public create: RouteHandler<Routes['create']> = async ({ input, reply }) => {
    const order = await this.services.create.execute(input.body);
    reply(201, toOrderResponse(order));
  };

  public updateStatus: RouteHandler<Routes['updateStatus']> = async ({
    input,
    reply,
  }) => {
    const order = await this.services.updateStatus.execute({
      id: input.params.id,
      status: input.body.status,
    });
    reply(200, toOrderResponse(order));
  };
}
