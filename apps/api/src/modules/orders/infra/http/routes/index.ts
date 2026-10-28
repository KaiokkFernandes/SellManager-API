import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { CreateOrderService } from '../../../services/CreateOrderService';
import { ListOrdersService } from '../../../services/ListOrdersService';
import { ShowOrderService } from '../../../services/ShowOrderService';
import { UpdateOrderStatusService } from '../../../services/UpdateOrderStatusService';
import { OrdersController } from '../controllers/OrdersController';

export function registerOrdersRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { orders, customers } = container.repositories;
  const { ordersUnitOfWork } = container;

  const controller = new OrdersController({
    list: new ListOrdersService(orders),
    show: new ShowOrderService(orders),
    create: new CreateOrderService(customers, ordersUnitOfWork),
    updateStatus: new UpdateOrderStatusService(ordersUnitOfWork),
  });

  mount(routes.orders.list, controller.list);
  mount(routes.orders.show, controller.show);
  mount(routes.orders.create, controller.create);
  mount(routes.orders.complete, controller.complete);
  mount(routes.orders.cancel, controller.cancel);
}
