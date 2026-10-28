import type { routes } from '@sellmanager/shared';
import { ChangeOrderStatusService } from '../../../services/ChangeOrderStatusService';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { CreateOrderService } from '../../../services/CreateOrderService';
import { ListOrdersService } from '../../../services/ListOrdersService';
import { ShowOrderService } from '../../../services/ShowOrderService';
import { toOrderResponse } from '../OrderMapper';

interface OrdersServices {
  list: ListOrdersService;
  show: ShowOrderService;
  create: CreateOrderService;
  changeStatus: ChangeOrderStatusService;
}

type Routes = typeof routes.orders;

export class OrdersController {
  constructor(private readonly services: OrdersServices) {}

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { customer_id, status, from, to, page, limit } = input.query;
    const { data, meta } = await this.services.list.execute(
      {
        customer_id,
        status,
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

  public pay: RouteHandler<Routes['pay']> = async ({ input, reply }) => {
    const order = await this.services.changeStatus.execute({
      id: input.params.id,
      action: 'pay',
    });
    reply(200, toOrderResponse(order));
  };

  public ship: RouteHandler<Routes['ship']> = async ({ input, reply }) => {
    const order = await this.services.changeStatus.execute({
      id: input.params.id,
      action: 'ship',
    });
    reply(200, toOrderResponse(order));
  };

  public deliver: RouteHandler<Routes['deliver']> = async ({
    input,
    reply,
  }) => {
    const order = await this.services.changeStatus.execute({
      id: input.params.id,
      action: 'deliver',
    });
    reply(200, toOrderResponse(order));
  };

  public cancel: RouteHandler<Routes['cancel']> = async ({ input, reply }) => {
    const order = await this.services.changeStatus.execute({
      id: input.params.id,
      action: 'cancel',
      reason: input.body.reason,
    });
    reply(200, toOrderResponse(order));
  };
}
