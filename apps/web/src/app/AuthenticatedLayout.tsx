import { ROLE_LABELS, type Permission } from '@sellmanager/shared';
import { Link } from '@tanstack/react-router';
import {
  FileDown,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  TriangleAlert,
  UserCog,
  Users,
} from 'lucide-react';
import { AppLayout, type NavItem } from '@/components/layout/AppLayout';
import { useAuth, useCan } from '@/features/auth';
import { useLowStockProducts } from '@/features/products';

/** Menu completo; cada item aparece só para quem tem a permissão (mapa do shared). */
const navItems: readonly (NavItem & { permission?: Permission })[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    to: '/customers',
    label: 'Clientes',
    icon: Users,
    permission: 'customer:read',
  },
  {
    to: '/products',
    label: 'Produtos',
    icon: Package,
    permission: 'product:read',
  },
  {
    to: '/categories',
    label: 'Categorias',
    icon: Tags,
    permission: 'category:create',
  },
  {
    to: '/orders',
    label: 'Pedidos',
    icon: ShoppingCart,
    permission: 'order:read',
  },
  {
    to: '/reports',
    label: 'Relatórios',
    icon: FileDown,
    permission: 'report:read',
  },
  { to: '/users', label: 'Usuários', icon: UserCog, permission: 'user:read' },
];

export function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const can = useCan();
  const visible = navItems.filter(
    item => !item.permission || can(item.permission),
  );
  return (
    <AppLayout
      navItems={visible}
      userName={user?.name}
      userRole={user ? ROLE_LABELS[user.role] : undefined}
      profileTo="/profile"
      onLogout={logout}
      headerExtra={can('product:read') ? <LowStockAlert /> : null}
    />
  );
}

/** Alerta de estoque baixo no cabeçalho (some quando não há nada abaixo). */
function LowStockAlert() {
  const low = useLowStockProducts(1, 1);
  const total = low.data?.meta.total ?? 0;
  if (total === 0) return null;
  const label = `${total} ${total === 1 ? 'produto' : 'produtos'} abaixo do estoque mínimo`;
  return (
    <Link
      to="/products/low-stock"
      className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 hover:underline dark:bg-amber-950 dark:text-amber-300"
      aria-label={label}
      title={label}
    >
      <TriangleAlert className="size-3.5" aria-hidden="true" />
      <span className="tabular-nums">{total}</span>
      <span className="hidden lg:inline">abaixo do mínimo</span>
    </Link>
  );
}
