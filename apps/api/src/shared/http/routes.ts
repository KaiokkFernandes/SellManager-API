import { Router } from 'express';
import { registerCustomersRoutes } from '@modules/customers/infra/http/routes';
import { registerOrdersRoutes } from '@modules/orders/infra/http/routes';
import { registerProductsRoutes } from '@modules/products/infra/http/routes';
import { registerUsersRoutes } from '@modules/users/infra/http/routes';
import { Container } from '@shared/container';
import { createRouteMounter } from './contract/mountRoute';
import { responseValidationMode } from './contract/responseValidation';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';
import { authRateLimiter } from './middlewares/rateLimiter';

export function createRoutes(container: Container): Router {
  const router = Router();

  // Todas as rotas vêm do contrato de @sellmanager/shared.
  const mount = createRouteMounter(router, {
    authenticated: ensureAuthenticated(container.providers.token),
    rateLimiter: authRateLimiter,
    responseValidation: responseValidationMode,
  });

  registerUsersRoutes(mount, container);
  registerProductsRoutes(mount, container);
  registerCustomersRoutes(mount, container);
  registerOrdersRoutes(mount, container);

  return router;
}
