import { Request, Router } from 'express';
import { routes } from '@sellmanager/shared';
import { registerCategoriesRoutes } from '@modules/categories/infra/http/routes';
import { registerCustomersRoutes } from '@modules/customers/infra/http/routes';
import { registerMetricsRoutes } from '@modules/metrics/infra/http/routes';
import { registerReportsRoutes } from '@modules/reports/infra/http/routes';
import { registerOrdersRoutes } from '@modules/orders/infra/http/routes';
import { registerProductsRoutes } from '@modules/products/infra/http/routes';
import { registerUsersRoutes } from '@modules/users/infra/http/routes';
import { Container } from '@shared/container';
import AppError from '@shared/errors/AppError';
import { createRouteMounter } from './contract/mountRoute';
import { responseValidationMode } from './contract/responseValidation';
import { databaseReady } from './middlewares/databaseReady';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';
import { authRateLimiter } from './middlewares/rateLimiter';

export function createRoutes(container: Container): Router {
  const router = Router();

  router.use(databaseReady(container.database));

  // Todas as rotas vêm do contrato de @sellmanager/shared.
  const mount = createRouteMounter(router, {
    authenticated: ensureAuthenticated(
      container.providers.token,
      container.repositories.users,
    ),
    rateLimiter: authRateLimiter,
    responseValidation: responseValidationMode,
  });

  mount(routes.health.show, async ({ request, reply }) => {
    try {
      await container.database.ping();
    } catch (error) {
      (request as Request).log.error({ err: error }, 'Health check falhou');
      throw new AppError('Service temporarily unavailable', 503);
    }
    reply(200, { status: 'ok' });
  });

  registerUsersRoutes(mount, container);
  registerProductsRoutes(mount, container);
  registerCategoriesRoutes(mount, container);
  registerCustomersRoutes(mount, container);
  registerOrdersRoutes(mount, container);
  registerMetricsRoutes(mount, container);
  registerReportsRoutes(mount, container);

  return router;
}
