import { getRouteApi } from '@tanstack/react-router';
import { PageHeader } from '@/components/feedback/PageHeader';
import { Badge } from '@/components/ui/badge';
import { formatLocalDay } from '@/lib/format';
import { useAuth } from '@/features/auth';
import { KpiCards } from './KpiCards';
import { PeriodPicker } from './PeriodPicker';
import { useSummary } from './queries';
import { toPeriodQuery } from './search';

const route = getRouteApi('/authenticated/');

export function DashboardPage() {
  const { user } = useAuth();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const period = toPeriodQuery(search);
  const summary = useSummary(period);
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
      <KpiCards query={summary} />
    </>
  );
}
