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
import {
  CustomerDetailPage,
  CustomersListPage,
  customersSearchSchema,
  EditCustomerPage,
  NewCustomerPage,
} from '@/features/customers';
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
// ---- Clientes
const customersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/customers',
  component: Outlet,
});
const customersListRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/',
  validateSearch: customersSearchSchema,
  component: CustomersListPage,
});
const newCustomerRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/new',
  component: NewCustomerPage,
});
const customerRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/$customerId',
  component: Outlet,
});
const customerDetailRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/',
  component: CustomerDetailPage,
});
const editCustomerRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: '/edit',
  component: EditCustomerPage,
});

// ---- Produtos
const productsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/products',
  component: ProductsPage,
});

// ---- Pedidos
const ordersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/orders',
  component: Outlet,
});
const ordersListRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/',
  component: OrdersPage,
});
const newOrderRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/new',
  validateSearch: z.object({
    customer_id: z.uuid().optional().catch(undefined),
  }),
  component: OrdersPage,
});
const orderDetailRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/$orderId',
  component: OrdersPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    customersRoute.addChildren([
      customersListRoute,
      newCustomerRoute,
      customerRoute.addChildren([customerDetailRoute, editCustomerRoute]),
    ]),
    productsRoute,
    ordersRoute.addChildren([ordersListRoute, newOrderRoute, orderDetailRoute]),
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
