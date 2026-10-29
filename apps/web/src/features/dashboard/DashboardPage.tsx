import { getRouteApi } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageHeader } from '@/components/feedback/PageHeader';
import { ORDER_STATUS_LABELS } from '@/components/status/orderStatusLabels';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents, formatLocalDay } from '@/lib/format';
import { useAuth } from '@/features/auth';
import { BarList } from './BarList';
import { DashboardBlock } from './DashboardBlock';
import { KpiCards } from './KpiCards';
import { PeriodPicker } from './PeriodPicker';
import {
  useOrdersByStatus,
  useRevenue,
  useSalesByCategory,
  useSummary,
} from './queries';
import { toPeriodQuery } from './search';

// o Recharts só baixa quando o gráfico aparece: os KPIs não esperam por ele
const RevenueChart = lazy(() => import('./RevenueChart'));

const route = getRouteApi('/authenticated/');

const GRANULARITY = { day: 'por dia', week: 'por semana', month: 'por mês' };

export function DashboardPage() {
  const { user } = useAuth();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const period = toPeriodQuery(search);
  const summary = useSummary(period);
  const revenue = useRevenue(period);
  const categories = useSalesByCategory(period);
  const statuses = useOrdersByStatus(period);
  const resolved = summary.data?.period.current;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          <span className="flex flex-wrap items-center gap-2">
            {resolved
              ? `Vendas de ${formatLocalDay(resolved.from)} a ${formatLocalDay(resolved.to)}`
              : user
                ? `Olá, ${user.name}.`
                : 'Resumo de vendas.'}
            {summary.data?.scope === 'own' ? (
              <Badge variant="outline">Seus números</Badge>
            ) : null}
          </span>
        }
      />
      <PeriodPicker
        key={`${search.preset ?? ''}${search.from ?? ''}${search.to ?? ''}`}
        value={search}
        onChange={next => void navigate({ search: next })}
      />
      <div className="space-y-6">
        <KpiCards query={summary} />

        <DashboardBlock
          title="Faturamento"
          description={
            revenue.data
              ? `Vendas pagas, ${GRANULARITY[revenue.data.granularity]}`
              : undefined
          }
          query={revenue}
          isEmpty={data => data.points.every(point => point.orders === 0)}
        >
          {data => (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RevenueChart data={data} />
            </Suspense>
          )}
        </DashboardBlock>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardBlock
            title="Vendas por categoria"
            description="Pela categoria atual do produto"
            query={categories}
            isEmpty={data => data.items.length === 0}
          >
            {data => (
              <BarList
                label="Vendas por categoria"
                items={data.items.map(item => ({
                  key: item.category?.id ?? 'none',
                  label: item.category?.name ?? 'Sem categoria',
                  value: item.revenue_cents,
                  display: formatCents(item.revenue_cents),
                  detail: `${item.units} un.`,
                  link: item.category
                    ? {
                        to: '/products',
                        search: { category_id: item.category.id },
                      }
                    : undefined,
                }))}
              />
            )}
          </DashboardBlock>

          <DashboardBlock
            title="Pedidos por status"
            description="Criados no período, pelo status atual"
            query={statuses}
            isEmpty={data => data.items.every(item => item.orders === 0)}
            emptyMessage="Nenhum pedido criado no período."
          >
            {data => (
              <BarList
                label="Pedidos por status"
                items={data.items.map(item => ({
                  key: item.status,
                  label: ORDER_STATUS_LABELS[item.status],
                  value: item.orders,
                  display: String(item.orders),
                  detail: formatCents(item.total_cents),
                  // a lista de pedidos filtra pela data de criação, como este bloco
                  link: {
                    to: '/orders',
                    search: {
                      status: item.status,
                      from: data.period.current.from,
                      to: data.period.current.to,
                    },
                  },
                }))}
              />
            )}
          </DashboardBlock>
        </div>
      </div>
    </>
  );
}
