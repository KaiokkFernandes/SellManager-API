import { getRouteApi, Link } from '@tanstack/react-router';
import { Ban, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/feedback/PageHeader';
import { OrderStatusBadge } from '@/components/status/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/apiErrors';
import { formatCents, formatDateTime } from '@/lib/format';
import { notify } from '@/lib/notify';
import { useOrder, useUpdateOrderStatus } from './queries';

const route = getRouteApi('/authenticated/orders/$orderId');

type Action = 'completed' | 'canceled';

const ACTIONS: Record<
  Action,
  { title: string; description: string; label: string }
> = {
  completed: {
    title: 'Concluir pedido?',
    description:
      'O pedido será marcado como concluído e não poderá mais ser alterado.',
    label: 'Concluir pedido',
  },
  canceled: {
    title: 'Cancelar pedido?',
    description:
      'Os itens voltam ao estoque e o pedido não poderá mais ser alterado.',
    label: 'Cancelar pedido',
  },
};

export function OrderDetailPage() {
  const { orderId } = route.useParams();
  const order = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus(orderId);
  const [action, setAction] = useState<Action | null>(null);

  if (order.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (order.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(order.error)}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void order.refetch()}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  const { data } = order;
  return (
    <>
      <PageHeader
        title={`Pedido de ${formatDateTime(data.created_at)}`}
        description={`Nº ${data.id.slice(0, 8)}`}
        actions={
          data.status === 'pending' ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setAction('canceled')}>
                <Ban aria-hidden="true" />
                Cancelar pedido
              </Button>
              <Button onClick={() => setAction('completed')}>
                <CheckCircle2 aria-hidden="true" />
                Concluir pedido
              </Button>
            </div>
          ) : null
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <OrderStatusBadge status={data.status} />
        <span>
          Cliente:{' '}
          <Link
            to="/customers/$customerId"
            params={{ customerId: data.customer.id }}
            className="font-medium hover:underline"
          >
            {data.customer.name}
          </Link>{' '}
          <span className="text-muted-foreground">({data.customer.email})</span>
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <caption className="sr-only">
              Itens do pedido, com o preço do momento da compra
            </caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço na compra</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCents(item.price_cents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCents(item.price_cents * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 flex justify-end gap-3 border-t pt-4 text-lg">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold tabular-nums">
              {formatCents(data.total_cents)}
            </span>
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={action !== null}
        onOpenChange={open => !open && setAction(null)}
        title={action ? ACTIONS[action].title : ''}
        description={action ? ACTIONS[action].description : ''}
        confirmLabel={action ? ACTIONS[action].label : ''}
        destructive={action === 'canceled'}
        isPending={updateStatus.isPending}
        onConfirm={() => {
          if (!action) return;
          updateStatus.mutate(action, {
            onSuccess: () => setAction(null),
            onError: error => {
              setAction(null);
              notify.error(error);
            },
          });
        }}
      />
    </>
  );
}
