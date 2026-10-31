import type { RevenueSeries } from '@sellmanager/api-client';
import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { formatCents, formatCentsCompact } from '@/lib/format';

const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/** Rótulo do balde: "29/10", "sem. 26/10" ou "out/26". */
function bucketLabel(
  bucket: string,
  granularity: RevenueSeries['granularity'],
) {
  const [year, month, day] = bucket.split('-');
  if (granularity === 'month')
    return `${MONTHS[Number(month) - 1] ?? month}/${year?.slice(2)}`;
  return `${granularity === 'week' ? 'sem. ' : ''}${day}/${month}`;
}

const UNIT = { day: 'dia', week: 'semana', month: 'mês' } as const;

function ChartTooltip({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  const point = payload?.[0]?.payload as
    { label: string; revenue_cents: number; orders: number } | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{point.label}</p>
      <p className="tabular-nums">{formatCents(point.revenue_cents)}</p>
      <p className="text-xs text-muted-foreground">
        {point.orders} {point.orders === 1 ? 'venda' : 'vendas'}
      </p>
    </div>
  );
}

/**
 * Faturamento no tempo. Cores do tema (variáveis CSS: claro e escuro), eixo Y
 * abreviado ("R$ 12 mil") e rótulos espaçados para caber em 375px. A tabela
 * escondida dá os mesmos números para leitores de tela.
 */
export default function RevenueChart({ data }: { data: RevenueSeries }) {
  const gradient = useId();
  const points = data.points.map(point => ({
    ...point,
    label: bucketLabel(point.bucket, data.granularity),
  }));

  return (
    <>
      <div className="h-64 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0 }}>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.35}
                />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value: number) => formatCentsCompact(value)}
              width={72}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: 'var(--border)' }}
            />
            <Area
              type="monotone"
              dataKey="revenue_cents"
              name="Faturamento"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill={`url(#${gradient})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Faturamento por {UNIT[data.granularity]}</caption>
        <thead>
          <tr>
            <th scope="col">Período</th>
            <th scope="col">Faturamento</th>
            <th scope="col">Vendas</th>
          </tr>
        </thead>
        <tbody>
          {points.map(point => (
            <tr key={point.bucket}>
              <th scope="row">{point.label}</th>
              <td>{formatCents(point.revenue_cents)}</td>
              <td>{point.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
