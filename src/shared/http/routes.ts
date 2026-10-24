import { Router } from 'express';
import { makeCustomersRoutes } from '@modules/customers/infra/http/routes';
import { makeProductsRoutes } from '@modules/products/infra/http/routes';
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
  routes.use('/products', makeProductsRoutes(container, authenticated));
  routes.use('/customers', makeCustomersRoutes(container, authenticated));

  return routes;
}
