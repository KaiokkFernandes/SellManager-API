import { Router } from 'express';
import asyncHandler from '@config/Middleware';
import { idParamsSchema, validate } from '@shared/http/middlewares/validate';
import CustomerController from '../controllers/CustomersControllers';
import isAuthenticated from '@modules/users/middlewares/isAuthenticated';
import { customerBodySchema } from './customers.schemas';

const CustomerRouter = Router();
const customerController = new CustomerController();

CustomerRouter.use(isAuthenticated);

CustomerRouter.get(
  '/',
  asyncHandler(customerController.index.bind(customerController)),
);

CustomerRouter.get(
  '/:id',
  validate({ params: idParamsSchema }),
  asyncHandler(customerController.show.bind(customerController)),
);

CustomerRouter.post(
  '/',
  validate({ body: customerBodySchema }),
  asyncHandler(customerController.create.bind(customerController)),
);

CustomerRouter.put(
  '/:id',
  validate({ params: idParamsSchema, body: customerBodySchema }),
  asyncHandler(customerController.update.bind(customerController)),
);

CustomerRouter.delete(
  '/:id',
  validate({ params: idParamsSchema }),
  asyncHandler(customerController.delete.bind(customerController)),
);

export default CustomerRouter;
