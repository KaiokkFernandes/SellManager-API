import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { CreateCustomerService } from '../../../services/CreateCustomerService';
import { DeleteCustomerService } from '../../../services/DeleteCustomerService';
import { ListCustomersService } from '../../../services/ListCustomersService';
import { ShowCustomerService } from '../../../services/ShowCustomerService';
import { UpdateCustomerService } from '../../../services/UpdateCustomerService';
import { CustomersController } from '../controllers/CustomersController';

export function registerCustomersRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { customers, orders } = container.repositories;

  const controller = new CustomersController({
    list: new ListCustomersService(customers),
    show: new ShowCustomerService(customers),
    create: new CreateCustomerService(customers),
    update: new UpdateCustomerService(customers),
    delete: new DeleteCustomerService(customers, orders),
  });

  mount(routes.customers.list, controller.list);
  mount(routes.customers.show, controller.show);
  mount(routes.customers.create, controller.create);
  mount(routes.customers.update, controller.update);
  mount(routes.customers.delete, controller.delete);
}
