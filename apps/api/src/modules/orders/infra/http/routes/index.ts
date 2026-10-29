import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { ChangeOrderStatusService } from '../../../services/ChangeOrderStatusService';
import { CreateOrderService } from '../../../services/CreateOrderService';
import { ListOrdersService } from '../../../services/ListOrdersService';
import { ShowOrderService } from '../../../services/ShowOrderService';
import { OrdersController } from '../controllers/OrdersController';

export function registerOrdersRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { orders, orderStatusHistory, customers } = container.repositories;
  const { ordersUnitOfWork } = container;

  const controller = new OrdersController({
    list: new ListOrdersService(orders),
    show: new ShowOrderService(orders, orderStatusHistory),
    create: new CreateOrderService(customers, ordersUnitOfWork),
    changeStatus: new ChangeOrderStatusService(ordersUnitOfWork),
  });

  mount(routes.orders.list, controller.list);
  mount(routes.orders.show, controller.show);
  mount(routes.orders.create, controller.create);
  mount(routes.orders.pay, controller.pay);
  mount(routes.orders.ship, controller.ship);
  mount(routes.orders.deliver, controller.deliver);
  mount(routes.orders.cancel, controller.cancel);
}
