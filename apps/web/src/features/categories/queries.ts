import { unwrap } from '@sellmanager/api-client';
import type { CategoryBody } from '@sellmanager/shared';
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

export function useCategoriesList(params: { q?: string; page?: number }) {
  const query = { q: params.q, page: params.page ?? 1, limit: PAGE_SIZE };
  return useQuery({
    queryKey: queryKeys.categories.list(query),
    queryFn: () => unwrap(api.GET('/categories', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}

/** Categoria mudou: listas de categorias e produtos (que exibem o nome). */
async function categoriesChanged(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  ]);
}

export function useSaveCategory(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryBody) =>
      unwrap(
        id
          ? api.PUT('/categories/{id}', { params: { path: { id } }, body })
          : api.POST('/categories', { body }),
      ),
    onSuccess: async () => {
      await categoriesChanged(queryClient);
      notify.success(id ? 'Categoria renomeada.' : 'Categoria criada.');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/categories/{id}', { params: { path: { id } } })),
    onSuccess: async () => {
      await categoriesChanged(queryClient);
      notify.success('Categoria excluída.');
    },
  });
}
