import type { Category } from '@sellmanager/api-client';
import { categoryBodySchema } from '@sellmanager/shared';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, DeleteDialog } from '@/components/confirm-dialog';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/feedback/PageHeader';
import { applyApiError, Form, TextField, useZodForm } from '@/components/form';
import { SearchInput } from '@/components/search';
import { Button } from '@/components/ui/button';
import { useCan } from '@/features/auth';
import {
  useCategoriesList,
  useDeleteCategory,
  useSaveCategory,
} from './queries';

const route = getRouteApi('/authenticated/categories');

/** Categorias de produto: criar, renomear e excluir (se não houver produtos). */
export function CategoriesListPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const list = useCategoriesList(search);
  const remove = useDeleteCategory();
  const can = useCan();
  // undefined = fechado; null = nova; Category = renomear
  const [editing, setEditing] = useState<Category | null | undefined>();
  const [deleting, setDeleting] = useState<Category | null>(null);
  const hasActions = can('category:update') || can('category:delete');

  const columns: Column<Category>[] = [
    { id: 'name', header: 'Nome', cell: category => category.name },
    {
      id: 'products',
      header: 'Produtos',
      className: 'text-right tabular-nums',
      cell: category =>
        category.products_count > 0 ? (
          <Link
            to="/products"
            search={{ category_id: category.id }}
            className="hover:underline"
          >
            {category.products_count}
          </Link>
        ) : (
          0
        ),
    },
    ...(hasActions
      ? [
          {
            id: 'actions',
            header: 'Ações',
            className: 'w-24 text-right',
            cell: (category: Category) => (
              <div className="flex justify-end gap-1">
                {can('category:update') ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Renomear ${category.name}`}
                    onClick={() => setEditing(category)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                ) : null}
                {can('category:delete') ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${category.name}`}
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Agrupam os produtos no catálogo e nos filtros."
        actions={
          can('category:create') ? (
            <Button onClick={() => setEditing(null)}>
              <Plus aria-hidden="true" />
              Nova categoria
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4">
        <SearchInput
          label="Buscar categorias por nome"
          value={search.q ?? ''}
          onSearch={q =>
            void navigate({ search: { q: q || undefined, page: undefined } })
          }
        />
      </div>
      <DataTable
        caption="Categorias"
        columns={columns}
        data={list.data?.data}
        meta={list.data?.meta}
        getRowId={category => category.id}
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        onPageChange={page =>
          void navigate({ search: prev => ({ ...prev, page }) })
        }
        emptyMessage={
          search.q
            ? `Nenhuma categoria encontrada para “${search.q}”.`
            : 'Nenhuma categoria cadastrada ainda.'
        }
        renderCard={category => (
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{category.name}</span>
            <span className="text-sm text-muted-foreground">
              {category.products_count} produto(s)
            </span>
          </div>
        )}
      />
      {editing !== undefined ? (
        <CategoryDialog
          category={editing}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
      <DeleteDialog
        target={deleting}
        onOpenChange={open => !open && setDeleting(null)}
        onDelete={() => remove.mutateAsync(deleting?.id ?? '')}
        inUseKey="products_count"
        describeInUse={count =>
          `Há ${count} produto(s) nesta categoria. Mova-os para outra categoria antes de excluir.`
        }
      />
    </>
  );
}

function CategoryDialog({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const save = useSaveCategory(category?.id);
  const form = useZodForm(categoryBodySchema, {
    defaultValues: { name: category?.name ?? '' },
  });
  const submit = form.handleSubmit(async body => {
    try {
      await save.mutateAsync(body);
      onClose();
    } catch (error) {
      applyApiError(form, error);
    }
  });

  return (
    <ConfirmDialog
      open
      onOpenChange={open => !open && onClose()}
      title={category ? `Renomear ${category.name}` : 'Nova categoria'}
      description="O nome é único, sem diferenciar maiúsculas."
      confirmLabel={category ? 'Salvar' : 'Criar categoria'}
      isPending={save.isPending}
      onConfirm={() => void submit()}
    >
      <Form form={form} onSubmit={() => void submit()}>
        <TextField
          control={form.control}
          name="name"
          label="Nome"
          autoComplete="off"
        />
      </Form>
    </ConfirmDialog>
  );
}
