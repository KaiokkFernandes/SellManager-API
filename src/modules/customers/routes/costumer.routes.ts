import { Router } from 'express';
import { idParamsSchema, validate } from '@shared/http/middlewares/validate';
import CustomerController from '../controllers/CustomersControllers';
import isAuthenticated from '@modules/users/middlewares/isAuthenticated';
import { customerBodySchema } from './customers.schemas';

const CustomerRouter = Router();
const customerController = new CustomerController();

CustomerRouter.use(isAuthenticated);

CustomerRouter.get('/', customerController.index.bind(customerController));

CustomerRouter.get(
  '/:id',
  validate({ params: idParamsSchema }),
  customerController.show.bind(customerController),
);

CustomerRouter.post(
  '/',
  validate({ body: customerBodySchema }),
  customerController.create.bind(customerController),
);

CustomerRouter.put(
  '/:id',
  validate({ params: idParamsSchema, body: customerBodySchema }),
  customerController.update.bind(customerController),
);

CustomerRouter.delete(
  '/:id',
  validate({ params: idParamsSchema }),
  customerController.delete.bind(customerController),
);

export default CustomerRouter;
