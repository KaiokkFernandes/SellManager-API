import { unwrap } from '@sellmanager/api-client';
import type {
  CancelOrderBody,
  CreateOrderBody,
  OrderAction,
  OrderStatus,
} from '@sellmanager/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { startOfLocalDay, startOfNextLocalDay } from '@/lib/dates';
import { PAGE_SIZE } from '@/lib/listSearch';
import { notify } from '@/lib/notify';
import { queryKeys } from '@/lib/queryKeys';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

export interface OrdersListParams {
  status?: OrderStatus;
  customer_id?: string;
  /** Dias locais (AAAA-MM-DD), inclusivos. */
  from?: string;
  to?: string;
  page?: number;
}

export function useOrdersList(params: OrdersListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () =>
      unwrap(
        api.GET('/orders', {
          params: {
            query: {
              status: params.status,
              customer_id: params.customer_id,
              from: params.from ? startOfLocalDay(params.from) : undefined,
              to: params.to ? startOfNextLocalDay(params.to) : undefined,
              page: params.page ?? 1,
              limit: PAGE_SIZE,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () =>
      unwrap(api.GET('/orders/{id}', { params: { path: { id } } })),
  });
}

/** Opções do combobox de clientes: busca no servidor com debounce. */
export function useCustomerOptions(term: string) {
  const q = useDebouncedValue(term.trim(), 250);
  const query = { q: q || undefined, limit: 10, page: 1 };
  return useQuery({
    queryKey: queryKeys.customers.list(query),
    queryFn: () => unwrap(api.GET('/customers', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}

/** Cliente já escolhido (ex.: vindo da URL) para mostrar o nome no combobox. */
export function useCustomerById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ''),
    queryFn: () =>
      unwrap(
        api.GET('/customers/{id}', { params: { path: { id: id ?? '' } } }),
      ),
    enabled: Boolean(id),
  });
}

/** Opções do combobox de produtos, com preço e estoque atuais. */
export function useProductOptions(term: string) {
  const q = useDebouncedValue(term.trim(), 250);
  const query = { q: q || undefined, limit: 10, page: 1 };
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => unwrap(api.GET('/products', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderBody) =>
      unwrap(api.POST('/orders', { body })),
    onSuccess: async order => {
      // pedidos, o cliente (e a lista de pedidos dele) e o estoque dos produtos mudaram
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.customers.detail(order.customer_id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      ]);
      notify.success('Pedido criado.');
    },
  });
}

const SUCCESS_MESSAGE: Record<OrderAction, string> = {
  pay: 'Pagamento registrado.',
  ship: 'Pedido marcado como enviado.',
  deliver: 'Pedido marcado como entregue.',
  cancel: 'Pedido cancelado. Os itens voltaram ao estoque.',
};

export type OrderActionInput =
  | { action: Exclude<OrderAction, 'cancel'> }
  | { action: 'cancel'; body: CancelOrderBody };

function requestAction(id: string, input: OrderActionInput) {
  const params = { path: { id } };
  switch (input.action) {
    case 'pay':
      return api.PATCH('/orders/{id}/pay', { params });
    case 'ship':
      return api.PATCH('/orders/{id}/ship', { params });
    case 'deliver':
      return api.PATCH('/orders/{id}/deliver', { params });
    case 'cancel':
      return api.PATCH('/orders/{id}/cancel', { params, body: input.body });
  }
}

/** Pagar, enviar, entregar ou cancelar (a API valida estado e papel). */
export function useOrderAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderActionInput) => unwrap(requestAction(id, input)),
    onSuccess: async (order, input) => {
      queryClient.setQueryData(queryKeys.orders.detail(id), order);
      // cancelar devolve o estoque
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      ]);
      notify.success(SUCCESS_MESSAGE[input.action]);
    },
  });
}
