import { getRouteApi, Link } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/feedback/PageHeader';
import { SearchInput } from '@/components/search';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import type { Customer } from '@sellmanager/api-client';
import { CUSTOMER_SORTS } from '@sellmanager/shared';
import { toSort } from '@/lib/listSearch';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import { useCustomersList } from './queries';

const route = getRouteApi('/authenticated/customers/');

export function CustomersListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const list = useCustomersList(search);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const columns: Column<Customer>[] = [
    {
      id: 'name',
      header: 'Nome',
      sortKey: 'name',
      cell: customer => (
        <Link
          to="/customers/$customerId"
          params={{ customerId: customer.id }}
          className="font-medium hover:underline"
        >
          {customer.name}
        </Link>
      ),
    },
    {
      id: 'email',
      header: 'E-mail',
      sortKey: 'email',
      cell: customer => customer.email,
    },
    {
      id: 'created_at',
      header: 'Cadastro',
      sortKey: 'created_at',
      cell: customer => formatDate(customer.created_at),
    },
    {
      id: 'actions',
      header: 'Ações',
      className: 'w-24 text-right',
      cell: customer => (
        <RowActions customer={customer} onDelete={setDeleting} />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Quem compra de você."
        actions={
          <Link to="/customers/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Novo cliente
          </Link>
        }
      />
      <div className="mb-4">
        <SearchInput
          label="Buscar por nome ou e-mail"
          value={search.q ?? ''}
          onSearch={q =>
            void navigate({
              search: prev => ({ ...prev, q: q || undefined, page: undefined }),
            })
          }
        />
      </div>
      <DataTable
        caption="Clientes"
        columns={columns}
        data={list.data?.data}
        meta={list.data?.meta}
        getRowId={customer => customer.id}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        sort={{ sort: search.sort ?? 'name', order: search.order ?? 'asc' }}
        onSortChange={({ sort, order }) =>
          void navigate({
            search: prev => ({
              ...prev,
              sort: toSort(sort, CUSTOMER_SORTS),
              order,
              page: undefined,
            }),
          })
        }
        onPageChange={page =>
          void navigate({ search: prev => ({ ...prev, page }) })
        }
        emptyMessage={
          search.q
            ? `Nenhum cliente encontrado para “${search.q}”.`
            : 'Nenhum cliente cadastrado ainda.'
        }
        emptyAction={
          search.q ? null : (
            <Link
              to="/customers/new"
              className={buttonVariants({ size: 'sm' })}
            >
              <Plus aria-hidden="true" />
              Cadastrar o primeiro cliente
            </Link>
          )
        }
        renderCard={customer => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/customers/$customerId"
                params={{ customerId: customer.id }}
                className="block truncate font-medium hover:underline"
              >
                {customer.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {customer.email}
              </p>
            </div>
            <RowActions customer={customer} onDelete={setDeleting} />
          </div>
        )}
      />
      <DeleteCustomerDialog
        customer={deleting}
        onOpenChange={open => !open && setDeleting(null)}
      />
    </>
  );
}

function RowActions({
  customer,
  onDelete,
}: {
  customer: Customer;
  onDelete: (customer: Customer) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Link
        to="/customers/$customerId/edit"
        params={{ customerId: customer.id }}
        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        aria-label={`Editar ${customer.name}`}
      >
        <Pencil aria-hidden="true" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Excluir ${customer.name}`}
        onClick={() => onDelete(customer)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}
