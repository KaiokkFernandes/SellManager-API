import { Link, Outlet, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export interface NavItem {
  to: LinkProps['to'];
  label: string;
  icon: LucideIcon;
}

interface AppLayoutProps {
  navItems: readonly NavItem[];
  /** Nome exibido no header; undefined enquanto o perfil carrega. */
  userName: string | undefined;
  /** Papel exibido abaixo do nome (ex.: "Vendedor"). */
  userRole?: string;
  /** Destino do link no nome do usuário (página de perfil). */
  profileTo: LinkProps['to'];
  onLogout: () => void;
  /** Conteúdo extra no cabeçalho, antes do usuário (ex.: alertas). */
  headerExtra?: ReactNode;
}

function NavLinks({
  items,
  collapsed,
  onNavigate,
}: {
  items: readonly NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={collapsed ? label : undefined}
          activeOptions={{ exact: to === '/' }}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-0',
          )}
          activeProps={{
            className: 'bg-accent text-accent-foreground',
            'aria-current': 'page',
          }}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {collapsed ? null : <span>{label}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Estrutura do app autenticado: sidebar recolhível (drawer no mobile) + header. */
export function AppLayout({
  navItems,
  userName,
  userRole,
  profileTo,
  headerExtra,
  onLogout,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r bg-sidebar p-3 transition-[width] md:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div
          className={cn(
            'px-3 py-2 text-lg font-semibold',
            collapsed && 'px-0 text-center',
          )}
        >
          {collapsed ? 'S' : 'SellManager'}
        </div>
        <NavLinks items={navItems} collapsed={collapsed} />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetTitle className="px-3 py-2 text-lg font-semibold">
            SellManager
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegação
          </SheetDescription>
          <NavLinks
            items={navItems}
            collapsed={false}
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed(value => !value)}
            aria-label={
              collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
            }
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {headerExtra}
            {userName === undefined ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <Link
                to={profileTo}
                className="flex max-w-[10rem] flex-col items-end rounded-sm px-1 text-right leading-tight hover:underline sm:max-w-xs"
                title="Meu perfil"
              >
                <span className="max-w-full truncate text-sm font-medium">
                  {userName}
                </span>
                {userRole ? (
                  <span className="text-xs text-muted-foreground">
                    {userRole}
                  </span>
                ) : null}
              </Link>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
              <span className="sr-only sm:hidden">Sair</span>
            </Button>
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
