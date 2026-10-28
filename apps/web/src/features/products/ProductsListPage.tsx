import type { Product } from '@sellmanager/api-client';
import { PRODUCT_SORTS } from '@sellmanager/shared';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { formatCents } from '@/lib/format';
import { toSort } from '@/lib/listSearch';
import { useCan } from '@/features/auth';
import { DeleteProductDialog } from './DeleteProductDialog';
import { ProductThumbnail } from './ProductThumbnail';
import { useCategoryOptions, useProductsList } from './queries';
import { StockBadge } from './StockBadge';

const route = getRouteApi('/authenticated/products/');

export function ProductsListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const list = useProductsList(search);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const can = useCan();
  const hasRowActions = can('product:update') || can('product:delete');

  const columns: Column<Product>[] = [
    {
      id: 'name',
      header: 'Produto',
      sortKey: 'name',
      cell: product => (
        <div className="flex items-center gap-3">
          <ProductThumbnail url={product.image_url} />
          <ProductName product={product} className="font-medium" />
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: product => product.category?.name ?? '—',
    },
    {
      id: 'price',
      header: 'Preço',
      sortKey: 'price',
      className: 'text-right tabular-nums',
      cell: product => formatCents(product.price_cents),
    },
    {
      id: 'quantity',
      header: 'Estoque',
      sortKey: 'quantity',
      cell: product => <StockBadge product={product} />,
    },
    ...(hasRowActions
      ? [
          {
            id: 'actions',
            header: 'Ações',
            className: 'w-24 text-right',
            cell: (product: Product) => (
              <RowActions product={product} onDelete={setDeleting} />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Catálogo, preços e estoque."
        actions={
          can('product:create') ? (
            <Link to="/products/new" className={buttonVariants()}>
              <Plus aria-hidden="true" />
              Novo produto
            </Link>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          label="Buscar produtos por nome"
          value={search.q ?? ''}
          onSearch={q =>
            void navigate({
              search: prev => ({ ...prev, q: q || undefined, page: undefined }),
            })
          }
        />
        <CategoryFilter
          value={search.category_id}
          onChange={category_id =>
            void navigate({
              search: prev => ({ ...prev, category_id, page: undefined }),
            })
          }
        />
      </div>
      <DataTable
        caption="Produtos"
        columns={columns}
        data={list.data?.data}
        meta={list.data?.meta}
        getRowId={product => product.id}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        sort={{ sort: search.sort ?? 'name', order: search.order ?? 'asc' }}
        onSortChange={({ sort, order }) =>
          void navigate({
            search: prev => ({
              ...prev,
              sort: toSort(sort, PRODUCT_SORTS),
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
            ? `Nenhum produto encontrado para “${search.q}”.`
            : search.category_id
              ? 'Nenhum produto nesta categoria.'
              : 'Nenhum produto cadastrado ainda.'
        }
        emptyAction={
          search.q || search.category_id || !can('product:create') ? null : (
            <Link to="/products/new" className={buttonVariants({ size: 'sm' })}>
              <Plus aria-hidden="true" />
              Cadastrar o primeiro produto
            </Link>
          )
        }
        renderCard={product => (
          <div className="flex items-center gap-3">
            <ProductThumbnail url={product.image_url} className="size-12" />
            <div className="min-w-0 flex-1">
              <ProductName
                product={product}
                className="block truncate font-medium"
              />
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="tabular-nums">
                  {formatCents(product.price_cents)}
                </span>
                <StockBadge product={product} />
              </p>
            </div>
            <RowActions product={product} onDelete={setDeleting} />
          </div>
        )}
      />
      <DeleteProductDialog
        product={deleting}
        onOpenChange={open => !open && setDeleting(null)}
      />
    </>
  );
}

function RowActions({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (product: Product) => void;
}) {
  const can = useCan();
  return (
    <div className="flex justify-end gap-1">
      {can('product:update') ? (
        <Link
          to="/products/$productId/edit"
          params={{ productId: product.id }}
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          aria-label={`Editar ${product.name}`}
        >
          <Pencil aria-hidden="true" />
        </Link>
      ) : null}
      {can('product:delete') ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Excluir ${product.name}`}
          onClick={() => onDelete(product)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

/** Nome do produto: link para a edição só para quem pode editar. */
function ProductName({
  product,
  className,
}: {
  product: Product;
  className: string;
}) {
  const canEdit = useCan()('product:update');
  if (!canEdit) return <span className={className}>{product.name}</span>;
  return (
    <Link
      to="/products/$productId/edit"
      params={{ productId: product.id }}
      className={`${className} hover:underline`}
    >
      {product.name}
    </Link>
  );
}

const ALL = 'all';

function CategoryFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
}) {
  const id = useId();
  const categories = useCategoryOptions();
  return (
    <div className="flex flex-col gap-1.5 sm:w-56">
      <Label htmlFor={id}>Categoria</Label>
      <Select
        value={value ?? ALL}
        onValueChange={next => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas</SelectItem>
          {categories.data?.data.map(category => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
