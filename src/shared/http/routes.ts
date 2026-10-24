import { Router } from 'express';
import CustomerRouter from '@modules/customers/routes/costumer.routes';
import productRouter from '@modules/product/routes/products.routes';
import { makeUsersRoutes } from '@modules/users/infra/http/routes';
import { Container } from '@shared/container';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';

export function createRoutes(container: Container): Router {
  const authenticated = ensureAuthenticated(container.providers.token);
  const users = makeUsersRoutes(container, authenticated);

  const routes = Router();

  routes.use('/users', users.usersRouter);
  routes.use('/sessions', users.sessionsRouter);
  routes.use('/profile', users.profileRouter);
  routes.use('/password', users.passwordRouter);
  routes.use('/products', productRouter);
  routes.use('/customers', CustomerRouter);

  return routes;
}
