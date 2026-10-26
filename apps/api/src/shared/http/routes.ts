import { Router } from 'express';
import { env } from '@config/env';
import { registerCustomersRoutes } from '@modules/customers/infra/http/routes';
import { registerOrdersRoutes } from '@modules/orders/infra/http/routes';
import { registerProductsRoutes } from '@modules/products/infra/http/routes';
import { registerUsersRoutes } from '@modules/users/infra/http/routes';
import { Container } from '@shared/container';
import { createRouteMounter } from './contract/mountRoute';
import { ResponseValidationMode } from './contract/responseValidation';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';
import { authRateLimiter } from './middlewares/rateLimiter';

const responseValidationByEnv: Record<
  typeof env.NODE_ENV,
  ResponseValidationMode
> = {
  test: 'strict',
  development: 'warn',
  production: 'off',
};

export function createRoutes(container: Container): Router {
  const router = Router();

  // Todas as rotas vêm do contrato de @sellmanager/shared.
  const mount = createRouteMounter(router, {
    authenticated: ensureAuthenticated(container.providers.token),
    rateLimiter: authRateLimiter,
    responseValidation: responseValidationByEnv[env.NODE_ENV],
  });

  registerUsersRoutes(mount, container);
  registerProductsRoutes(mount, container);
  registerCustomersRoutes(mount, container);
  registerOrdersRoutes(mount, container);

  return router;
}
