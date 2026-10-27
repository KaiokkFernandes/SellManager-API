import { unwrap } from '@sellmanager/api-client';
import type {
  CustomerBody,
  CustomerSort,
  SortOrder,
} from '@sellmanager/shared';
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

export interface CustomersListParams {
  q?: string;
  page?: number;
  sort?: CustomerSort;
  order?: SortOrder;
}

export function useCustomersList(params: CustomersListParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () =>
      unwrap(
        api.GET('/customers', {
          params: {
            query: { ...params, page: params.page ?? 1, limit: PAGE_SIZE },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () =>
      unwrap(api.GET('/customers/{id}', { params: { path: { id } } })),
  });
}

/** Pedidos do cliente (direto da API de pedidos: features não se importam). */
export function useCustomerOrders(customerId: string, page: number) {
  const query = { customer_id: customerId, page, limit: 10 };
  return useQuery({
    queryKey: queryKeys.orders.list(query),
    queryFn: () => unwrap(api.GET('/orders', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomerBody) =>
      unwrap(api.POST('/customers', { body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      });
      notify.success('Cliente cadastrado.');
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomerBody) =>
      unwrap(api.PUT('/customers/{id}', { params: { path: { id } }, body })),
    onSuccess: async () => {
      // os pedidos exibem o nome/e-mail do cliente
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
      ]);
      notify.success('Cliente atualizado.');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE('/customers/{id}', { params: { path: { id } } })),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      });
      notify.success('Cliente excluído.');
    },
  });
}
