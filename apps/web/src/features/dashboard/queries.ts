import { unwrap } from '@sellmanager/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { PeriodQuery } from '@/components/period-picker';

/**
 * Um hook por bloco do dashboard: cada bloco carrega, falha e tenta de novo
 * sozinho. keepPreviousData evita piscar ao trocar de período; staleTime
 * acompanha o Cache-Control curto da API.
 */
const common = {
  placeholderData: keepPreviousData,
  staleTime: 60_000,
} as const;

export function useSummary(period: PeriodQuery) {
  return useQuery({
    queryKey: queryKeys.metrics.block('summary', period),
    queryFn: () =>
      unwrap(api.GET('/metrics/summary', { params: { query: period } })),
    ...common,
  });
}

export function useRevenue(period: PeriodQuery) {
  return useQuery({
    queryKey: queryKeys.metrics.block('revenue', period),
    queryFn: () =>
      unwrap(api.GET('/metrics/revenue', { params: { query: period } })),
    ...common,
  });
}

export function useTopProducts(period: PeriodQuery) {
  const query = { ...period, limit: 5 };
  return useQuery({
    queryKey: queryKeys.metrics.block('top-products', query),
    queryFn: () =>
      unwrap(api.GET('/metrics/top-products', { params: { query } })),
    ...common,
  });
}

export function useTopCustomers(period: PeriodQuery) {
  const query = { ...period, limit: 5 };
  return useQuery({
    queryKey: queryKeys.metrics.block('top-customers', query),
    queryFn: () =>
      unwrap(api.GET('/metrics/top-customers', { params: { query } })),
    ...common,
  });
}

export function useSalesByCategory(period: PeriodQuery) {
  return useQuery({
    queryKey: queryKeys.metrics.block('categories', period),
    queryFn: () =>
      unwrap(api.GET('/metrics/categories', { params: { query: period } })),
    ...common,
  });
}

export function useOrdersByStatus(period: PeriodQuery) {
  return useQuery({
    queryKey: queryKeys.metrics.block('status', period),
    queryFn: () =>
      unwrap(api.GET('/metrics/status', { params: { query: period } })),
    ...common,
  });
}

/** Contagem de produtos abaixo do mínimo (mesma chave do alerta do layout). */
export function useLowStockCount() {
  const query = { page: 1, limit: 1 };
  return useQuery({
    queryKey: queryKeys.products.lowStock(query),
    queryFn: () =>
      unwrap(api.GET('/products/low-stock', { params: { query } })),
  });
}
