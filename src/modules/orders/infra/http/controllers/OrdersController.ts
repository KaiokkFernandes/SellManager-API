import { Request, Response } from 'express';
import { validatedQuery } from '@shared/http/middlewares/validate';
import { CreateOrderService } from '../../../services/CreateOrderService';
import { ListOrdersService } from '../../../services/ListOrdersService';
import { ShowOrderService } from '../../../services/ShowOrderService';
import { UpdateOrderStatusService } from '../../../services/UpdateOrderStatusService';
import {
  CreateOrderBody,
  ListOrdersQuery,
  UpdateOrderStatusBody,
} from '../schemas';

interface OrdersServices {
  list: ListOrdersService;
  show: ShowOrderService;
  create: CreateOrderService;
  updateStatus: UpdateOrderStatusService;
}

export class OrdersController {
  constructor(private readonly services: OrdersServices) {}

  public index = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const { customer_id, page, limit } =
      validatedQuery<ListOrdersQuery>(request);
    response.json(
      await this.services.list.execute({ customer_id }, { page, limit }),
    );
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
    const order = await this.services.create.execute(
      request.body as CreateOrderBody,
    );
    response.status(201).json(order);
  };

  public updateStatus = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    const { status } = request.body as UpdateOrderStatusBody;
    response.json(
      await this.services.updateStatus.execute({
        id: request.params.id,
        status,
      }),
    );
  };
}
