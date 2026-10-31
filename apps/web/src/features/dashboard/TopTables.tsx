import type { TopCustomers, TopProducts } from '@sellmanager/api-client';
import { Link } from '@tanstack/react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCents } from '@/lib/format';
import { useCan } from '@/features/auth';

export function TopProductsTable({ data }: { data: TopProducts }) {
  const canEdit = useCan()('product:update');
  return (
    <Table>
      <caption className="sr-only">Produtos com mais faturamento</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Produto</TableHead>
          <TableHead className="text-right">Un.</TableHead>
          <TableHead className="text-right">Faturamento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.items.map(({ product, units, revenue_cents }) => (
          <TableRow key={product.id}>
            <TableCell className="max-w-[12rem] truncate font-medium">
              {/* quem não edita produto cai na lista filtrada pelo nome */}
              {canEdit ? (
                <Link
                  to="/products/$productId/edit"
                  params={{ productId: product.id }}
                  className="hover:underline"
                >
                  {product.name}
                </Link>
              ) : (
                <Link
                  to="/products"
                  search={{ q: product.name }}
                  className="hover:underline"
                >
                  {product.name}
                </Link>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">{units}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCents(revenue_cents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TopCustomersTable({ data }: { data: TopCustomers }) {
  return (
    <Table>
      <caption className="sr-only">Clientes com mais faturamento</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Cliente</TableHead>
          <TableHead className="text-right">Pedidos</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.items.map(({ customer, orders, revenue_cents }) => (
          <TableRow key={customer.id}>
            <TableCell className="max-w-[12rem] truncate font-medium">
              <Link
                to="/customers/$customerId"
                params={{ customerId: customer.id }}
                className="hover:underline"
              >
                {customer.name}
              </Link>
            </TableCell>
            <TableCell className="text-right tabular-nums">{orders}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCents(revenue_cents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
