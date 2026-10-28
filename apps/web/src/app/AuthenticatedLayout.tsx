import { ROLE_LABELS, type Permission } from '@sellmanager/shared';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  UserCog,
  Users,
} from 'lucide-react';
import { AppLayout, type NavItem } from '@/components/layout/AppLayout';
import { useAuth, useCan } from '@/features/auth';

/** Menu completo; cada item aparece só para quem tem a permissão (mapa do shared). */
const navItems: readonly (NavItem & { permission?: Permission })[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
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
    to: '/orders',
    label: 'Pedidos',
    icon: ShoppingCart,
    permission: 'order:read',
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
    />
  );
}
