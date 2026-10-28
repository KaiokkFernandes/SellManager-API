import type { User } from '@sellmanager/api-client';
import { ROLE_LABELS, ROLES } from '@sellmanager/shared';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useId, useState } from 'react';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/feedback/PageHeader';
import { SearchInput } from '@/components/search';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useCan } from '@/features/auth';
import { formatDate } from '@/lib/format';
import { useUsersList } from './queries';
import { RoleBadge, StatusBadge } from './RoleBadge';
import { UserStatusDialog } from './UserStatusDialog';

const route = getRouteApi('/authenticated/users/');
const ALL = 'all';

export function UsersListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const list = useUsersList(search);
  const can = useCan();
  const { user: me } = useAuth();
  const [toggling, setToggling] = useState<User | null>(null);
  const roleId = useId();
  const statusId = useId();

  const actions = (user: User) => (
    <div className="flex justify-end gap-1">
      {can('user:update') ? (
        <>
          <Link
            to="/users/$userId/edit"
            params={{ userId: user.id }}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            aria-label={`Editar ${user.name}`}
          >
            <Pencil aria-hidden="true" />
          </Link>
          {user.id === me?.id ? null : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${user.active ? 'Desativar' : 'Reativar'} ${user.name}`}
              onClick={() => setToggling(user)}
            >
              {user.active ? (
                <PowerOff aria-hidden="true" />
              ) : (
                <Power aria-hidden="true" />
              )}
            </Button>
          )}
        </>
      ) : null}
    </div>
  );

  const columns: Column<User>[] = [
    {
      id: 'name',
      header: 'Nome',
      cell: user => (
        <span className="font-medium">
          {user.name}
          {user.id === me?.id ? (
            <span className="ml-1 text-xs text-muted-foreground">(você)</span>
          ) : null}
        </span>
      ),
    },
    { id: 'email', header: 'E-mail', cell: user => user.email },
    {
      id: 'role',
      header: 'Papel',
      cell: user => <RoleBadge role={user.role} />,
    },
    {
      id: 'status',
      header: 'Situação',
      cell: user => <StatusBadge active={user.active} />,
    },
    {
      id: 'created_at',
      header: 'Desde',
      cell: user => formatDate(user.created_at),
    },
    {
      id: 'actions',
      header: 'Ações',
      className: 'w-24 text-right',
      cell: actions,
    },
  ];

  const setFilter = (changes: Partial<typeof search>) =>
    void navigate({
      search: prev => ({ ...prev, ...changes, page: undefined }),
    });

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem acessa o SellManager e com qual papel."
        actions={
          can('user:create') ? (
            <Link to="/users/new" className={buttonVariants()}>
              <Plus aria-hidden="true" />
              Novo usuário
            </Link>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchInput
          label="Buscar por nome ou e-mail"
          value={search.q ?? ''}
          onSearch={q => setFilter({ q: q || undefined })}
        />
        <div className="flex flex-col gap-1.5 sm:w-44">
          <Label htmlFor={roleId}>Papel</Label>
          <Select
            value={search.role ?? ALL}
            onValueChange={value =>
              setFilter({
                role:
                  value === ALL ? undefined : (value as (typeof ROLES)[number]),
              })
            }
          >
            <SelectTrigger id={roleId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {ROLES.map(role => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-40">
          <Label htmlFor={statusId}>Situação</Label>
          <Select
            value={search.status ?? ALL}
            onValueChange={value =>
              setFilter({
                status:
                  value === ALL ? undefined : (value as 'active' | 'inactive'),
              })
            }
          >
            <SelectTrigger id={statusId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        caption="Usuários"
        columns={columns}
        data={list.data?.data}
        meta={list.data?.meta}
        getRowId={user => user.id}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        onPageChange={page =>
          void navigate({ search: prev => ({ ...prev, page }) })
        }
        emptyMessage="Nenhum usuário com esses filtros."
        renderCard={user => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
              <p className="flex gap-2">
                <RoleBadge role={user.role} />
                <StatusBadge active={user.active} />
              </p>
            </div>
            {actions(user)}
          </div>
        )}
      />
      <UserStatusDialog
        user={toggling}
        onOpenChange={open => !open && setToggling(null)}
      />
    </>
  );
}
