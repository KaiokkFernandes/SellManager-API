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
    const { customer_id, from, to, page, limit } = input.query;
    const { data, meta } = await this.services.list.execute(
      {
        customer_id,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      },
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

  public complete: RouteHandler<Routes['complete']> = async ({
    input,
    reply,
  }) => {
    const order = await this.services.updateStatus.execute({
      id: input.params.id,
      status: 'completed',
    });
    reply(200, toOrderResponse(order));
  };

  public cancel: RouteHandler<Routes['cancel']> = async ({ input, reply }) => {
    const order = await this.services.updateStatus.execute({
      id: input.params.id,
      status: 'canceled',
    });
    reply(200, toOrderResponse(order));
  };
}
