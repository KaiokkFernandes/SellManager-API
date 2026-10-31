import type { MetricsSummary } from '@sellmanager/api-client';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/apiErrors';
import { formatCents, formatLocalDay, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { UseQueryResult } from '@tanstack/react-query';

interface Kpi {
  label: string;
  value: string;
  detail?: string;
  /** Variação relativa, ou em pontos (`points`); null = sem base de comparação. */
  change: number | null;
  points?: boolean;
  /** Subir é ruim (cancelamentos). */
  inverse?: boolean;
}

function kpisOf({ current, change }: MetricsSummary): Kpi[] {
  return [
    {
      label: 'Faturamento',
      value: formatCents(current.revenue_cents),
      change: change.revenue,
    },
    {
      label: 'Vendas',
      value: String(current.orders),
      detail: 'pedidos pagos',
      change: change.orders,
    },
    {
      label: 'Ticket médio',
      value: formatCents(current.average_ticket_cents),
      change: change.average_ticket,
    },
    {
      label: 'Cancelados',
      value: formatPercent(current.cancel_rate),
      detail: `${current.canceled_orders} · ${formatCents(current.canceled_cents)}`,
      change: change.cancel_rate,
      points: true,
      inverse: true,
    },
  ];
}

function ChangeBadge({ kpi, compared }: { kpi: Kpi; compared: string }) {
  if (kpi.change === null) {
    return (
      <p className="text-xs text-muted-foreground">
        — sem base no período anterior
      </p>
    );
  }
  const up = kpi.change > 0;
  const flat = kpi.change === 0;
  const good = flat ? null : up !== Boolean(kpi.inverse);
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const amount = kpi.points
    ? `${up ? '+' : ''}${(kpi.change * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.`
    : `${up ? '+' : ''}${formatPercent(kpi.change)}`;
  return (
    <p
      className={cn(
        'flex items-center gap-1 text-xs',
        good === true && 'text-emerald-700 dark:text-emerald-400',
        good === false && 'text-destructive',
        good === null && 'text-muted-foreground',
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>
        {amount} <span className="text-muted-foreground">{compared}</span>
      </span>
    </p>
  );
}

/** KPIs do período com a variação contra o anterior (texto + seta, não só cor). */
export function KpiCards({ query }: { query: UseQueryResult<MetricsSummary> }) {
  if (query.isPending) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border p-4"
      >
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
    );
  }

  const { previous } = query.data.period;
  const compared = `vs ${formatLocalDay(previous.from)} a ${formatLocalDay(previous.to)}`;
  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Indicadores"
    >
      {kpisOf(query.data).map(kpi => (
        <li key={kpi.label}>
          <Card className="h-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
              {kpi.detail ? (
                <p className="text-xs text-muted-foreground">{kpi.detail}</p>
              ) : null}
              <ChangeBadge kpi={kpi} compared={compared} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
