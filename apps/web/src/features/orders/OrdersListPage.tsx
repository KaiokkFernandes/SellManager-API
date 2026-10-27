import type { Customer, Order } from '@sellmanager/api-client';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Combobox } from '@/components/combobox';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/feedback/PageHeader';
import { OrderStatusBadge } from '@/components/status/OrderStatusBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCents, formatDateTime } from '@/lib/format';
import { useCustomerById, useCustomerOptions, useOrdersList } from './queries';

const route = getRouteApi('/authenticated/orders/');

/** Unidades somadas de todas as linhas do pedido. */
function unitsOf(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

const columns: Column<Order>[] = [
  {
    id: 'date',
    header: 'Data',
    cell: order => (
      <Link
        to="/orders/$orderId"
        params={{ orderId: order.id }}
        className="font-medium hover:underline"
      >
        {formatDateTime(order.created_at)}
      </Link>
    ),
  },
  { id: 'customer', header: 'Cliente', cell: order => order.customer.name },
  {
    id: 'items',
    header: 'Itens',
    className: 'text-right tabular-nums',
    cell: order => unitsOf(order),
  },
  {
    id: 'total',
    header: 'Total',
    className: 'text-right tabular-nums',
    cell: order => formatCents(order.total_cents),
  },
  {
    id: 'status',
    header: 'Status',
    cell: order => <OrderStatusBadge status={order.status} />,
  },
];

export function OrdersListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const invalidRange = Boolean(
    search.from && search.to && search.to < search.from,
  );
  const list = useOrdersList(search, !invalidRange);
  const filtered = Boolean(search.customer_id || search.from || search.to);

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Vendas, das mais recentes para as mais antigas."
        actions={
          <Link to="/orders/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Novo pedido
          </Link>
        }
      />
      <Filters
        customerId={search.customer_id}
        from={search.from}
        to={search.to}
        invalidRange={invalidRange}
        onChange={changes =>
          void navigate({
            search: prev => ({ ...prev, ...changes, page: undefined }),
          })
        }
        onClear={() => void navigate({ search: {} })}
      />
      <DataTable
        caption="Pedidos"
        columns={columns}
        data={invalidRange ? [] : list.data?.data}
        meta={invalidRange ? undefined : list.data?.meta}
        getRowId={order => order.id}
        isLoading={!invalidRange && list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        onPageChange={page =>
          void navigate({ search: prev => ({ ...prev, page }) })
        }
        emptyMessage={
          filtered ? 'Nenhum pedido com esses filtros.' : 'Nenhum pedido ainda.'
        }
        emptyAction={
          filtered ? null : (
            <Link to="/orders/new" className={buttonVariants({ size: 'sm' })}>
              <Plus aria-hidden="true" />
              Criar o primeiro pedido
            </Link>
          )
        }
        renderCard={order => (
          <Link
            to="/orders/$orderId"
            params={{ orderId: order.id }}
            className="block space-y-1"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {order.customer.name}
              </span>
              <span className="font-semibold tabular-nums">
                {formatCents(order.total_cents)}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {formatDateTime(order.created_at)} · {unitsOf(order)}{' '}
                {unitsOf(order) === 1 ? 'item' : 'itens'}
              </span>
              <OrderStatusBadge status={order.status} />
            </span>
          </Link>
        )}
      />
    </>
  );
}

interface FiltersProps {
  customerId: string | undefined;
  from: string | undefined;
  to: string | undefined;
  invalidRange: boolean;
  onChange: (changes: {
    customer_id?: string;
    from?: string;
    to?: string;
  }) => void;
  onClear: () => void;
}

function Filters({
  customerId,
  from,
  to,
  invalidRange,
  onChange,
  onClear,
}: FiltersProps) {
  const [term, setTerm] = useState('');
  const [chosen, setChosen] = useState<Customer | null>(null);
  const options = useCustomerOptions(term);
  const current = useCustomerById(customerId);
  const fromId = useId();
  const toId = useId();
  const customerLabelId = useId();
  const selected = customerId
    ? chosen?.id === customerId
      ? chosen
      : (current.data ?? null)
    : null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-64">
        <span id={customerLabelId} className="text-sm font-medium">
          Cliente
        </span>
        <Combobox
          aria-describedby={customerLabelId}
          aria-label="Filtrar por cliente"
          value={selected}
          onChange={customer => {
            setChosen(customer);
            onChange({ customer_id: customer.id });
          }}
          items={options.data?.data}
          isLoading={options.isFetching}
          onSearchChange={setTerm}
          getKey={customer => customer.id}
          getLabel={customer => customer.name}
          renderItem={customer => customer.email}
          placeholder="Todos os clientes"
          searchPlaceholder="Buscar cliente…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fromId}>De</Label>
          <Input
            id={fromId}
            type="date"
            value={from ?? ''}
            onChange={event =>
              onChange({ from: event.target.value || undefined })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={toId}>Até</Label>
          <Input
            id={toId}
            type="date"
            value={to ?? ''}
            min={from}
            aria-invalid={invalidRange}
            onChange={event =>
              onChange({ to: event.target.value || undefined })
            }
          />
        </div>
      </div>
      {customerId || from || to ? (
        <Button type="button" variant="ghost" onClick={onClear}>
          <X aria-hidden="true" />
          Limpar filtros
        </Button>
      ) : null}
      {invalidRange ? (
        <p role="alert" className="text-sm text-destructive sm:basis-full">
          A data final deve ser igual ou posterior à inicial.
        </p>
      ) : null}
    </div>
  );
}
