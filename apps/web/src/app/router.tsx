import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router';
import { can, type Permission } from '@sellmanager/shared';
import type { QueryClient } from '@tanstack/react-query';
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
import {
  LoginPage,
  profileQueryOptions,
  type AuthContextValue,
} from '@/features/auth';
import {
  NewOrderPage,
  newOrderSearchSchema,
  OrderDetailPage,
  OrdersListPage,
  ordersSearchSchema,
} from '@/features/orders';
import {
  EditProductPage,
  editProductSearchSchema,
  NewProductPage,
  ProductsListPage,
  productsSearchSchema,
} from '@/features/products';
import { ForbiddenError } from '@/lib/forbidden';
import { ProfilePage } from '@/features/profile';
import {
  EditUserPage,
  NewUserPage,
  UsersListPage,
  usersSearchSchema,
} from '@/features/users';
import { safeRedirect } from '@/lib/safeRedirect';
import { AuthenticatedLayout } from './AuthenticatedLayout';

export interface RouterContext {
  auth: AuthContextValue;
  queryClient: QueryClient;
}

/**
 * Exige a permissão do mapa do shared para abrir a rota; sem ela, a página 403
 * (via errorComponent) aparece dentro do layout. A API valida de novo.
 */
function requires(permission: Permission) {
  return ({ context }: { context: RouterContext }) => {
    // o layout autenticado já garantiu o perfil no cache (ensureQueryData)
    const user = context.queryClient.getQueryData(profileQueryOptions.queryKey);
    if (!user || !can(user.role, permission))
      throw new ForbiddenError(permission);
  };
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
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      // logout manual não precisa voltar à página onde estava
      const manual = context.auth.endedBy === 'manual';
      throw redirect({
        to: '/login',
        search: manual ? {} : { redirect: location.href },
      });
    }
    // perfil (papel) garantido antes das rotas filhas checarem permissão
    await context.queryClient.ensureQueryData(profileQueryOptions);
  },
  component: AuthenticatedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: DashboardPage,
});
// ---- Perfil (qualquer usuário logado)
const profileRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/profile',
  component: ProfilePage,
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
  beforeLoad: requires('customer:read'),
  validateSearch: customersSearchSchema,
  component: CustomersListPage,
});
const newCustomerRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/new',
  beforeLoad: requires('customer:create'),
  component: NewCustomerPage,
});
const customerRoute = createRoute({
  getParentRoute: () => customersRoute,
  path: '/$customerId',
  beforeLoad: requires('customer:read'),
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
  beforeLoad: requires('customer:update'),
  component: EditCustomerPage,
});

// ---- Produtos
const productsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/products',
  component: Outlet,
});
const productsListRoute = createRoute({
  getParentRoute: () => productsRoute,
  path: '/',
  beforeLoad: requires('product:read'),
  validateSearch: productsSearchSchema,
  component: ProductsListPage,
});
const newProductRoute = createRoute({
  getParentRoute: () => productsRoute,
  path: '/new',
  beforeLoad: requires('product:create'),
  component: NewProductPage,
});
const editProductRoute = createRoute({
  getParentRoute: () => productsRoute,
  path: '/$productId/edit',
  beforeLoad: requires('product:update'),
  validateSearch: editProductSearchSchema,
  component: EditProductPage,
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
  beforeLoad: requires('order:read'),
  validateSearch: ordersSearchSchema,
  component: OrdersListPage,
});
const newOrderRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/new',
  beforeLoad: requires('order:create'),
  validateSearch: newOrderSearchSchema,
  component: NewOrderPage,
});
const orderDetailRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/$orderId',
  beforeLoad: requires('order:read'),
  component: OrderDetailPage,
});

// ---- Usuários (só ADMIN, pelo mapa)
const usersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/users',
  component: Outlet,
});
const usersListRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/',
  beforeLoad: requires('user:read'),
  validateSearch: usersSearchSchema,
  component: UsersListPage,
});
const newUserRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/new',
  beforeLoad: requires('user:create'),
  component: NewUserPage,
});
const editUserRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/$userId/edit',
  beforeLoad: requires('user:update'),
  component: EditUserPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    profileRoute,
    customersRoute.addChildren([
      customersListRoute,
      newCustomerRoute,
      customerRoute.addChildren([customerDetailRoute, editCustomerRoute]),
    ]),
    productsRoute.addChildren([
      productsListRoute,
      newProductRoute,
      editProductRoute,
    ]),
    ordersRoute.addChildren([ordersListRoute, newOrderRoute, orderDetailRoute]),
    usersRoute.addChildren([usersListRoute, newUserRoute, editUserRoute]),
  ]),
]);

export function createAppRouter(options: { history?: RouterHistory } = {}) {
  return createRouter({
    routeTree,
    history: options.history,
    // o contexto real é injetado pelo <RouterProvider context={...}> em runtime
    context: {
      auth: undefined as unknown as AuthContextValue,
      queryClient: undefined as unknown as QueryClient,
    },
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
