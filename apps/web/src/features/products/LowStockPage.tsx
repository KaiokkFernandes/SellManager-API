import type { Product } from '@sellmanager/api-client';
import { getRouteApi } from '@tanstack/react-router';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/feedback/PageHeader';
import { ProductName } from './ProductName';
import { useLowStockProducts } from './queries';
import { StockBadge } from './StockBadge';

const route = getRouteApi('/authenticated/products/low-stock');

const columns: Column<Product>[] = [
  {
    id: 'name',
    header: 'Produto',
    cell: product => <ProductName product={product} className="font-medium" />,
  },
  {
    id: 'category',
    header: 'Categoria',
    cell: product => product.category?.name ?? '—',
  },
  {
    id: 'stock',
    header: 'Estoque',
    cell: product => <StockBadge product={product} />,
  },
  {
    id: 'min',
    header: 'Mínimo',
    className: 'text-right tabular-nums',
    cell: product => product.min_stock,
  },
  {
    id: 'missing',
    header: 'Faltam',
    className: 'text-right tabular-nums font-medium',
    cell: product => product.min_stock - product.quantity,
  },
];

/** Produtos abaixo do estoque mínimo, da maior falta para a menor. */
export function LowStockPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const list = useLowStockProducts(search.page ?? 1);

  return (
    <>
      <PageHeader
        title="Estoque baixo"
        description="Produtos abaixo do estoque mínimo, da maior falta para a menor."
      />
      <DataTable
        caption="Produtos abaixo do mínimo"
        columns={columns}
        data={list.data?.data}
        meta={list.data?.meta}
        getRowId={product => product.id}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        onPageChange={page => void navigate({ search: { page } })}
        emptyMessage="Nenhum produto abaixo do mínimo."
        renderCard={product => (
          <div className="flex items-center justify-between gap-2">
            <ProductName product={product} className="font-medium" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {product.quantity}/{product.min_stock} · faltam{' '}
              {product.min_stock - product.quantity}
            </span>
          </div>
        )}
      />
    </>
  );
}
