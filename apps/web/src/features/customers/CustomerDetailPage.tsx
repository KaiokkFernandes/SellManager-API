import type { Order } from '@sellmanager/api-client';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/feedback/PageHeader';
import { OrderStatusBadge } from '@/components/status/OrderStatusBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/apiErrors';
import { formatCents, formatDate, formatDateTime } from '@/lib/format';
import { useCan } from '@/features/auth';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import { useCustomer, useCustomerOrders } from './queries';

const route = getRouteApi('/authenticated/customers/$customerId/');

const orderColumns: Column<Order>[] = [
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
  { id: 'items', header: 'Itens', cell: order => order.items.length },
  {
    id: 'total',
    header: 'Total',
    className: 'text-right',
    cell: order => formatCents(order.total_cents),
  },
  {
    id: 'status',
    header: 'Status',
    cell: order => <OrderStatusBadge status={order.status} />,
  },
];

export function CustomerDetailPage() {
  const { customerId } = route.useParams();
  const navigate = useNavigate();
  const customer = useCustomer(customerId);
  const [ordersPage, setOrdersPage] = useState(1);
  const orders = useCustomerOrders(customerId, ordersPage);
  const [deleting, setDeleting] = useState(false);
  const can = useCan();

  if (customer.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (customer.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(customer.error)}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void customer.refetch()}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  const { data } = customer;
  return (
    <>
      <PageHeader
        title={data.name}
        description={data.email}
        actions={
          <div className="flex gap-2">
            {can('customer:update') ? (
              <Link
                to="/customers/$customerId/edit"
                params={{ customerId }}
                className={buttonVariants({ variant: 'outline' })}
              >
                <Pencil aria-hidden="true" />
                Editar
              </Link>
            ) : null}
            {can('customer:delete') ? (
              <Button variant="outline" onClick={() => setDeleting(true)}>
                <Trash2 aria-hidden="true" />
                Excluir
              </Button>
            ) : null}
          </div>
        }
      />
      <p className="mb-6 text-sm text-muted-foreground">
        Cliente desde {formatDate(data.created_at)}.
      </p>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Pedidos</CardTitle>
          {can('order:create') ? (
            <Link
              to="/orders/new"
              search={{ customer_id: customerId }}
              className={buttonVariants({ size: 'sm' })}
            >
              <Plus aria-hidden="true" />
              Novo pedido
            </Link>
          ) : null}
        </CardHeader>
        <CardContent>
          <DataTable
            caption={`Pedidos de ${data.name}`}
            columns={orderColumns}
            data={orders.data?.data}
            meta={orders.data?.meta}
            onPageChange={setOrdersPage}
            getRowId={order => order.id}
            isLoading={orders.isPending}
            error={orders.error}
            onRetry={() => void orders.refetch()}
            emptyMessage="Este cliente ainda não fez pedidos."
            skeletonRows={3}
          />
        </CardContent>
      </Card>

      <DeleteCustomerDialog
        customer={deleting ? data : null}
        onOpenChange={setDeleting}
        onDeleted={() => void navigate({ to: '/customers' })}
      />
    </>
  );
}
