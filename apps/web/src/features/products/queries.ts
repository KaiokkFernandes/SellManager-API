/**
 * MODELO de hooks de dados de uma feature (as outras seguem o mesmo padrão).
 *
 * Regras:
 *  - queryKey sempre via `queryKeys` (lib/queryKeys.ts), nunca string solta.
 *  - queryFn usa `unwrap(api....)`: devolve o dado tipado pelo contrato ou
 *    lança ApiClientError (mensagem amigável: `getErrorMessage`).
 *  - toda mutation invalida a chave RAIZ do recurso (`queryKeys.x.all`) e as de
 *    outros recursos que exibem o dado alterado.
 *  - toast de sucesso na mutation; erro deixe para o chamador (formulário usa
 *    `applyApiError`, ações soltas usam `notify.error`).
 */
import { unwrap, type Product } from '@sellmanager/api-client';
import type { ProductBody, ProductSort, SortOrder } from '@sellmanager/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PAGE_SIZE } from '@/lib/listSearch';
import { notify } from '@/lib/notify';
import { queryKeys } from '@/lib/queryKeys';

export interface ProductsListParams {
  q?: string;
  page?: number;
  sort?: ProductSort;
  order?: SortOrder;
  limit?: number;
}

/** Query: listagem paginada. `keepPreviousData` evita piscar ao trocar de página. */
export function useProductsList(params: ProductsListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () =>
      unwrap(
        api.GET('/products', {
          params: {
            query: {
              ...params,
              page: params.page ?? 1,
              limit: params.limit ?? PAGE_SIZE,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

/** Query: um item. */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () =>
      unwrap(api.GET('/products/{id}', { params: { path: { id } } })),
  });
}

/** Produto alterado: atualiza o detalhe em cache e invalida listas (e pedidos, que mostram o nome). */
async function productChanged(
  queryClient: ReturnType<typeof useQueryClient>,
  product: Product,
) {
  queryClient.setQueryData(queryKeys.products.detail(product.id), product);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  ]);
}

/** Mutation: criar. Invalida listagens e detalhes de produtos. */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductBody) => unwrap(api.POST('/products', { body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      notify.success('Produto cadastrado.');
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductBody) =>
      unwrap(api.PUT('/products/{id}', { params: { path: { id } }, body })),
    onSuccess: async product => {
      await productChanged(queryClient, product);
      notify.success('Produto atualizado.');
    },
  });
}

/** Mutation: excluir (204, sem corpo). */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/products/{id}', { params: { path: { id } } })),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      notify.success('Produto excluído.');
    },
  });
}

/** Upload com progresso (XHR no api-client); substitui a imagem atual. */
export function useUploadProductImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress: (fraction: number) => void;
    }) => api.uploadProductImage(id, file, { filename: file.name, onProgress }),
    onSuccess: async product => {
      await productChanged(queryClient, product);
      notify.success('Imagem atualizada.');
    },
  });
}

export function useRemoveProductImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      unwrap(api.DELETE('/products/{id}/image', { params: { path: { id } } })),
    onSuccess: async product => {
      await productChanged(queryClient, product);
      notify.success('Imagem removida.');
    },
  });
}
