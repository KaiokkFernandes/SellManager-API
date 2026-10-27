import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router';
import { z } from 'zod';
import { NotFoundPage } from '@/components/feedback/NotFoundPage';
import { RouteError } from '@/components/feedback/RouteError';
import { CustomersPage } from '@/features/customers';
import { DashboardPage } from '@/features/dashboard';
import { LoginPage, type AuthContextValue } from '@/features/auth';
import { OrdersPage } from '@/features/orders';
import { ProductsPage } from '@/features/products';
import { safeRedirect } from '@/lib/safeRedirect';
import { AuthenticatedLayout } from './AuthenticatedLayout';

export interface RouterContext {
  auth: AuthContextValue;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

/** Pública. Quem já está logado vai direto para o destino (ou o dashboard). */
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ href: safeRedirect(search.redirect) ?? '/' });
    }
  },
  component: LoginPage,
});

/** Layout das rotas protegidas. Sem sessão: /login preservando a rota de origem. */
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      // logout manual não precisa voltar à página onde estava
      const manual = context.auth.endedBy === 'manual';
      throw redirect({
        to: '/login',
        search: manual ? {} : { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: DashboardPage,
});
const customersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/customers',
  component: CustomersPage,
});
const productsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/products',
  component: ProductsPage,
});
const ordersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/orders',
  component: OrdersPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    customersRoute,
    productsRoute,
    ordersRoute,
  ]),
]);

export function createAppRouter(options: { history?: RouterHistory } = {}) {
  return createRouter({
    routeTree,
    history: options.history,
    // o contexto real é injetado pelo <RouterProvider context={...}> em runtime
    context: { auth: undefined as unknown as AuthContextValue },
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFoundPage,
    defaultPreload: 'intent',
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
