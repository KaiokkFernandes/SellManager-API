import { getRouteApi } from '@tanstack/react-router';
import { Download, Loader2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/feedback/PageHeader';
import {
  PeriodPicker,
  toPeriodQuery,
  type PeriodQuery,
} from '@/components/period-picker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUS_LABELS } from '@/components/status/orderStatusLabels';
import {
  useCategoryOptions,
  useExportReport,
  type ReportRequest,
} from './queries';

const route = getRouteApi('/authenticated/reports');
const ALL = 'all';
const SALE_STATUSES = ['paid', 'shipped', 'delivered'] as const;

/** Relatórios CSV do período (abrem direto no Excel em português). */
export function ReportsPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const period = toPeriodQuery(search);

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exporte em CSV (abre no Excel e no Numbers, com acentos). Venda = pedido pago e não cancelado, pela data do pagamento."
      />
      <PeriodPicker
        key={`${search.preset ?? ''}${search.from ?? ''}${search.to ?? ''}`}
        value={search}
        onChange={next => void navigate({ search: next })}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <SalesReport period={period} />
        <ProductsReport period={period} />
        <CustomersReport period={period} />
      </div>
    </>
  );
}

function ReportCard({
  title,
  description,
  children,
  request,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  request: ReportRequest;
}) {
  const exportReport = useExportReport();
  const pending = exportReport.isPending;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        {children}
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => exportReport.mutate(request)}
        >
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {pending ? 'Gerando…' : `Exportar ${title.toLowerCase()} (CSV)`}
        </Button>
      </CardContent>
    </Card>
  );
}

function SalesReport({ period }: { period: PeriodQuery }) {
  const [status, setStatus] = useState<string>(ALL);
  const id = useId();
  return (
    <ReportCard
      title="Vendas"
      description="Um pedido pago por linha: data do pagamento, cliente, status, itens, total e quem criou."
      request={{
        report: 'sales',
        query: {
          ...period,
          status:
            status === ALL
              ? undefined
              : (status as (typeof SALE_STATUSES)[number]),
        },
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as vendas</SelectItem>
            {SALE_STATUSES.map(item => (
              <SelectItem key={item} value={item}>
                {ORDER_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ReportCard>
  );
}

function ProductsReport({ period }: { period: PeriodQuery }) {
  const [category, setCategory] = useState<string>(ALL);
  const [belowMin, setBelowMin] = useState(false);
  const categories = useCategoryOptions();
  const id = useId();
  const checkId = useId();
  return (
    <ReportCard
      title="Produtos"
      description="Catálogo com estoque, mínimo e o vendido (unidades e faturamento) no período."
      request={{
        report: 'products',
        query: {
          ...period,
          category_id: category === ALL ? undefined : category,
          below_min_stock: belowMin ? 'true' : undefined,
        },
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {categories.data?.data.map(item => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label htmlFor={checkId} className="flex items-center gap-2 text-sm">
        <input
          id={checkId}
          type="checkbox"
          className="size-4 accent-[var(--primary)]"
          checked={belowMin}
          onChange={event => setBelowMin(event.target.checked)}
        />
        Só abaixo do estoque mínimo
      </label>
    </ReportCard>
  );
}

function CustomersReport({ period }: { period: PeriodQuery }) {
  const [everyone, setEveryone] = useState(false);
  const checkId = useId();
  return (
    <ReportCard
      title="Clientes"
      description="Pedidos, total comprado e última compra no período, do maior para o menor."
      request={{
        report: 'customers',
        query: { ...period, only_buyers: everyone ? 'false' : 'true' },
      }}
    >
      <label htmlFor={checkId} className="flex items-center gap-2 text-sm">
        <input
          id={checkId}
          type="checkbox"
          className="size-4 accent-[var(--primary)]"
          checked={everyone}
          onChange={event => setEveryone(event.target.checked)}
        />
        Incluir quem não comprou no período
      </label>
    </ReportCard>
  );
}
