import { unwrap, unwrapFile } from '@sellmanager/api-client';
import type {
  CustomersReportQuery,
  ProductsReportQuery,
  SalesReportQuery,
} from '@sellmanager/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { queryKeys } from '@/lib/queryKeys';
import { saveFile } from '@/lib/saveFile';

/** Query string dos relatórios (booleanos viram "true"/"false"). */
type Query<T> = {
  [K in keyof T]: T[K] extends boolean | undefined ? string : T[K];
};

export type ReportRequest =
  | { report: 'sales'; query: Query<SalesReportQuery> }
  | { report: 'products'; query: Query<ProductsReportQuery> }
  | { report: 'customers'; query: Query<CustomersReportQuery> };

function request({ report, query }: ReportRequest) {
  // parseAs blob: o CSV chega como arquivo; o erro continua JSON
  switch (report) {
    case 'sales':
      return api.GET('/reports/sales', { params: { query }, parseAs: 'blob' });
    case 'products':
      return api.GET('/reports/products', {
        params: { query },
        parseAs: 'blob',
      });
    case 'customers':
      return api.GET('/reports/customers', {
        params: { query },
        parseAs: 'blob',
      });
  }
}

/** Baixa o CSV com o token no header e entrega o arquivo ao navegador. */
export function useExportReport() {
  return useMutation({
    mutationFn: async (input: ReportRequest) => {
      const file = await unwrapFile(request(input));
      saveFile(file.blob, file.filename ?? `${input.report}.csv`);
      return file;
    },
    onSuccess: file => notify.success(`Arquivo ${file.filename ?? ''} gerado.`),
    onError: error => notify.error(error),
  });
}

/** Categorias para o filtro do relatório de produtos. */
export function useCategoryOptions() {
  const query = { page: 1, limit: 100 };
  return useQuery({
    queryKey: queryKeys.categories.list(query),
    queryFn: () => unwrap(api.GET('/categories', { params: { query } })),
    staleTime: 60_000,
  });
}
