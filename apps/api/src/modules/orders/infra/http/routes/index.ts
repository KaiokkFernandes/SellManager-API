import { RequestHandler, Router } from 'express';
import { Container } from '@shared/container';
import { validate } from '@shared/http/middlewares/validate';
import { idParamsSchema } from '@sellmanager/shared';
import { CreateOrderService } from '../../../services/CreateOrderService';
import { ListOrdersService } from '../../../services/ListOrdersService';
import { ShowOrderService } from '../../../services/ShowOrderService';
import { UpdateOrderStatusService } from '../../../services/UpdateOrderStatusService';
import { OrdersController } from '../controllers/OrdersController';
import {
  createOrderBodySchema,
  listOrdersQuerySchema,
  updateOrderStatusBodySchema,
} from '@sellmanager/shared';

export function makeOrdersRoutes(
  container: Container,
  authenticated: RequestHandler,
): Router {
  const { orders, customers } = container.repositories;
  const { ordersUnitOfWork } = container;

  const controller = new OrdersController({
    list: new ListOrdersService(orders),
    show: new ShowOrderService(orders),
    create: new CreateOrderService(customers, ordersUnitOfWork),
    updateStatus: new UpdateOrderStatusService(ordersUnitOfWork),
  });

  const router = Router();

  router.use(authenticated);
  router.get('/', validate({ query: listOrdersQuerySchema }), controller.index);
  router.get('/:id', validate({ params: idParamsSchema }), controller.show);
  router.post(
    '/',
    validate({ body: createOrderBodySchema }),
    controller.create,
  );
  router.patch(
    '/:id/status',
    validate({ params: idParamsSchema, body: updateOrderStatusBodySchema }),
    controller.updateStatus,
  );

  return router;
}
