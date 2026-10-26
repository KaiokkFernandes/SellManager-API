/**
 * MODELO de hooks de dados de uma feature — copie para customers/orders.
 *
 * Regras:
 *  - queryKey sempre via `queryKeys` (lib/queryKeys.ts), nunca string solta.
 *  - queryFn usa `unwrap(api....)`: devolve o dado tipado pelo contrato ou
 *    lança ApiClientError (mensagem amigável: `getErrorMessage`).
 *  - toda mutation invalida a chave RAIZ do recurso (`queryKeys.x.all`).
 *  - toast de sucesso na mutation; erro deixe para o chamador (formulário usa
 *    `applyApiError`, ações soltas usam `notify.error`).
 */
import { unwrap } from '@sellmanager/api-client';
import type { ProductBody } from '@sellmanager/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { queryKeys } from '@/lib/queryKeys';

export interface ProductsListParams {
  page: number;
  limit: number;
}

/** Query: listagem paginada. `keepPreviousData` evita piscar ao trocar de página. */
export function useProductsList(params: ProductsListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => unwrap(api.GET('/products', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });
}

/** Query: um item. */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => unwrap(api.GET('/products/{id}', { params: { path: { id } } })),
  });
}

/** Mutation: criar. Invalida listagens e detalhes de produtos. */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductBody) => unwrap(api.POST('/products', { body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      notify.success('Produto criado.');
    },
  });
}

/** Mutation: excluir (204, sem corpo). */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/products/{id}', { params: { path: { id } } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      notify.success('Produto excluído.');
    },
  });
}
