import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/apiErrors';
import { cn } from '@/lib/utils';

/**
 * Card de um bloco do dashboard com os estados próprios: carregando, erro com
 * "Tentar de novo" e vazio. Um bloco com problema não derruba os outros.
 */
export function DashboardBlock<T>({
  title,
  description,
  query,
  isEmpty,
  emptyMessage = 'Sem vendas no período.',
  className,
  children,
}: {
  title: string;
  description?: string;
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  className?: string;
  children: (data: T) => ReactNode;
}) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent aria-busy={query.isPending}>
        {query.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-destructive">
              {getErrorMessage(query.error)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              Tentar de novo
            </Button>
          </div>
        ) : isEmpty?.(query.data) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          children(query.data)
        )}
      </CardContent>
    </Card>
  );
}
