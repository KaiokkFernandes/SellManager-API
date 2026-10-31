import { getRouteApi, Link } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { PageHeader } from '@/components/feedback/PageHeader';
import { ORDER_STATUS_LABELS } from '@/components/status/orderStatusLabels';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents, formatLocalDay } from '@/lib/format';
import { useAuth, useCan } from '@/features/auth';
import { BarList } from './BarList';
import { DashboardBlock } from './DashboardBlock';
import { KpiCards } from './KpiCards';
import {
  useLowStockCount,
  useOrdersByStatus,
  useRevenue,
  useSalesByCategory,
  useSummary,
  useTopCustomers,
  useTopProducts,
} from './queries';
import { TopCustomersTable, TopProductsTable } from './TopTables';
import { PeriodPicker, toPeriodQuery } from '@/components/period-picker';

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
  const topProducts = useTopProducts(period);
  const topCustomers = useTopCustomers(period);
  const can = useCan();
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
        {can('product:read') ? <LowStockNotice /> : null}

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

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardBlock
            title="Top produtos"
            description="Por faturamento (preço da compra)"
            query={topProducts}
            isEmpty={data => data.items.length === 0}
          >
            {data => <TopProductsTable data={data} />}
          </DashboardBlock>
          <DashboardBlock
            title="Top clientes"
            description="Por total comprado"
            query={topCustomers}
            isEmpty={data => data.items.length === 0}
          >
            {data => <TopCustomersTable data={data} />}
          </DashboardBlock>
        </div>
      </div>
    </>
  );
}

/** Estoque baixo não depende do período: é o estado atual. */
function LowStockNotice() {
  const low = useLowStockCount();
  const total = low.data?.meta.total ?? 0;
  if (total === 0) return null;
  return (
    <Link
      to="/products/low-stock"
      className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:underline dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      {total === 1
        ? '1 produto está abaixo do estoque mínimo.'
        : `${total} produtos estão abaixo do estoque mínimo.`}{' '}
      Ver lista
    </Link>
  );
}
