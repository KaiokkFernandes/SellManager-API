import { LayoutDashboard, Package, ShoppingCart, Users } from 'lucide-react';
import { AppLayout, type NavItem } from '@/components/layout/AppLayout';
import { useAuth } from '@/features/auth';

const navItems: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/orders', label: 'Pedidos', icon: ShoppingCart },
];

export function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  return (
    <AppLayout navItems={navItems} userName={user?.name} onLogout={logout} />
  );
}
