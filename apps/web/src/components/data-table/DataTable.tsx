import type { PaginationMeta, SortOrder } from '@sellmanager/shared';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

export interface Column<T> {
  /** Identificador estável da coluna (usado como key). */
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Campo de ordenação da API; com ele o cabeçalho vira um botão de ordenar. */
  sortKey?: string;
}

export interface SortState {
  sort: string;
  order: SortOrder;
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[];
  /** Linhas da página atual. */
  data: readonly T[] | undefined;
  getRowId: (row: T) => string;
  /** `meta` da resposta paginada da API; sem ele, não mostra paginação. */
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  /** Ordenação atual e o que fazer ao clicar em um cabeçalho ordenável. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  isLoading?: boolean;
  /** Erro da query: mostra a mensagem amigável e o botão de tentar de novo. */
  error?: unknown;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Chamada para ação no estado vazio (ex.: "Cadastrar o primeiro cliente"). */
  emptyAction?: ReactNode;
  /** Descrição acessível da tabela (caption para leitores de tela). */
  caption: string;
  skeletonRows?: number;
  /** Em telas estreitas (< 640px) mostra cards em vez da tabela. */
  renderCard?: (row: T) => ReactNode;
}

function SortButton({
  column,
  sort,
  onSortChange,
}: {
  column: Column<unknown>;
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
}) {
  const active = sort !== undefined && sort.sort === column.sortKey;
  const Icon = !active
    ? ArrowUpDown
    : sort.order === 'asc'
      ? ArrowUp
      : ArrowDown;
  return (
    <button
      type="button"
      onClick={() =>
        onSortChange({
          sort: column.sortKey ?? '',
          order: active && sort.order === 'asc' ? 'desc' : 'asc',
        })
      }
      className={cn(
        '-ml-1 inline-flex items-center gap-1 rounded-sm px-1 hover:text-foreground',
        active && 'text-foreground',
      )}
    >
      {column.header}
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  );
}

/**
 * Tabela genérica: colunas tipadas, paginação ligada ao `meta` da API,
 * ordenação, cards no mobile e os estados de carregando, erro e vazio.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  meta,
  onPageChange,
  sort,
  onSortChange,
  isLoading,
  error,
  onRetry,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyAction,
  caption,
  skeletonRows = 5,
  renderCard,
}: DataTableProps<T>) {
  const hasError = error !== undefined && error !== null;
  const rows = !isLoading && !hasError ? (data ?? []) : [];

  return (
    <div className="rounded-lg border">
      <div className={cn(renderCard && 'hidden sm:block')}>
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map(column => {
                const active =
                  sort !== undefined && sort.sort === column.sortKey;
                return (
                  <TableHead
                    key={column.id}
                    className={column.className}
                    aria-sort={
                      column.sortKey && active
                        ? sort.order === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {column.sortKey && onSortChange ? (
                      <SortButton
                        column={column as Column<unknown>}
                        sort={sort}
                        onSortChange={onSortChange}
                      />
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={isLoading}>
            {isLoading
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    {columns.map(column => (
                      <TableCell key={column.id} className={column.className}>
                        <Skeleton className="h-4 w-full max-w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map(row => (
                  <TableRow key={getRowId(row)}>
                    {columns.map(column => (
                      <TableCell key={column.id} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {renderCard ? (
        <ul
          className="divide-y sm:hidden"
          aria-label={caption}
          aria-busy={isLoading}
        >
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <li key={index} className="space-y-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </li>
              ))
            : rows.map(row => (
                <li key={getRowId(row)} className="p-4">
                  {renderCard(row)}
                </li>
              ))}
        </ul>
      ) : null}

      {!isLoading && hasError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 p-8 text-center"
        >
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar de novo
            </Button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !hasError && data?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : null}

      {meta && !hasError && meta.total > 0 ? (
        <nav
          aria-label="Paginação"
          className="flex flex-wrap items-center justify-between gap-2 border-t p-3 text-sm"
        >
          <p className="text-muted-foreground" aria-live="polite">
            Página {meta.page} de {Math.max(meta.total_pages, 1)} · {meta.total}{' '}
            {meta.total === 1 ? 'item' : 'itens'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1 || isLoading}
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              <ChevronLeft aria-hidden="true" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.total_pages || isLoading}
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              Próxima
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
