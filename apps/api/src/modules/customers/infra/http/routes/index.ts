import { RequestHandler, Router } from 'express';
import { Container } from '@shared/container';
import { validate } from '@shared/http/middlewares/validate';
import { idParamsSchema, paginationQuerySchema } from '@sellmanager/shared';
import { CreateCustomerService } from '../../../services/CreateCustomerService';
import { DeleteCustomerService } from '../../../services/DeleteCustomerService';
import { ListCustomersService } from '../../../services/ListCustomersService';
import { ShowCustomerService } from '../../../services/ShowCustomerService';
import { UpdateCustomerService } from '../../../services/UpdateCustomerService';
import { CustomersController } from '../controllers/CustomersController';
import { customerBodySchema } from '@sellmanager/shared';

export function makeCustomersRoutes(
  container: Container,
  authenticated: RequestHandler,
): Router {
  const { customers } = container.repositories;

  const controller = new CustomersController({
    list: new ListCustomersService(customers),
    show: new ShowCustomerService(customers),
    create: new CreateCustomerService(customers),
    update: new UpdateCustomerService(customers),
    delete: new DeleteCustomerService(customers),
  });

  const router = Router();

  router.use(authenticated);
  router.get('/', validate({ query: paginationQuerySchema }), controller.index);
  router.get('/:id', validate({ params: idParamsSchema }), controller.show);
  router.post('/', validate({ body: customerBodySchema }), controller.create);
  router.put(
    '/:id',
    validate({ params: idParamsSchema, body: customerBodySchema }),
    controller.update,
  );
  router.delete(
    '/:id',
    validate({ params: idParamsSchema }),
    controller.delete,
  );

  return router;
}
