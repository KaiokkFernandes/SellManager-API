import type { PaginationMeta } from '@sellmanager/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[];
  /** Linhas da página atual. */
  data: readonly T[] | undefined;
  getRowId: (row: T) => string;
  /** `meta` da resposta paginada da API; sem ele, não mostra paginação. */
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  /** Erro da query: mostra a mensagem amigável e o botão de tentar de novo. */
  error?: unknown;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Descrição acessível da tabela (caption para leitores de tela). */
  caption: string;
  skeletonRows?: number;
}

/**
 * Tabela genérica com colunas tipadas, paginação ligada ao `meta` da API e os
 * estados de carregando, erro e vazio.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  meta,
  onPageChange,
  isLoading,
  error,
  onRetry,
  emptyMessage = 'Nenhum registro encontrado.',
  caption,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const hasError = error !== undefined && error !== null;

  return (
    <div className="rounded-lg border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map(column => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
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
            : hasError
              ? null
              : data?.map(row => (
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
        <p className="p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : null}

      {meta && !hasError && meta.total > 0 ? (
        <nav
          aria-label="Paginação"
          className={cn(
            'flex items-center justify-between gap-2 border-t p-3 text-sm',
          )}
        >
          <p className="text-muted-foreground" aria-live="polite">
            Página {meta.page} de {meta.total_pages} · {meta.total}{' '}
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
