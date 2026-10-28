/**
 * Convenção de query keys: [recurso, escopo, parâmetros].
 *   ['products']                   -> tudo de produtos (invalidar após mutation)
 *   ['products', 'list', params]   -> uma listagem
 *   ['products', 'detail', id]     -> um item
 * Invalidar a chave raiz atualiza listas e detalhes de uma vez.
 */
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params: object) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params: object) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: object) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (params: object) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
};
