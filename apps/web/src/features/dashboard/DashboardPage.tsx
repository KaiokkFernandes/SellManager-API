import { unwrap } from '@sellmanager/api-client';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/feedback/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiErrors';
import { useAuth } from '@/features/auth';
import { queryKeys } from '@/lib/queryKeys';

const ONE = { page: 1, limit: 1 } as const;

/** Totais vêm de `meta.total` das listagens (limit=1): não há endpoint de resumo. */
function useTotals() {
  const products = useQuery({
    queryKey: queryKeys.products.list(ONE),
    queryFn: () => unwrap(api.GET('/products', { params: { query: ONE } })),
  });
  const customers = useQuery({
    queryKey: queryKeys.customers.list(ONE),
    queryFn: () => unwrap(api.GET('/customers', { params: { query: ONE } })),
  });
  const orders = useQuery({
    queryKey: queryKeys.orders.list(ONE),
    queryFn: () => unwrap(api.GET('/orders', { params: { query: ONE } })),
  });
  return [
    { label: 'Produtos', query: products },
    { label: 'Clientes', query: customers },
    { label: 'Pedidos', query: orders },
  ] as const;
}

export function DashboardPage() {
  const { user } = useAuth();
  const totals = useTotals();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          user
            ? `Olá, ${user.name}. Este é o resumo do seu negócio.`
            : 'Resumo do seu negócio.'
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {totals.map(({ label, query }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {query.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : query.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  {getErrorMessage(query.error)}
                </p>
              ) : (
                <p
                  className="text-3xl font-semibold"
                  aria-label={`${label}: ${query.data.meta.total}`}
                >
                  {query.data.meta.total}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
