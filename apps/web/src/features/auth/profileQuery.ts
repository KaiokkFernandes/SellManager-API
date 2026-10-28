import { unwrap } from '@sellmanager/api-client';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Perfil do usuário logado (nome, papel). Compartilhado entre o AuthProvider e
 * o router, que o garante antes das rotas protegidas para checar permissões.
 * Revalida ao voltar para a aba: papel alterado por um ADMIN chega sem relogar.
 */
export const profileQueryOptions = queryOptions({
  queryKey: queryKeys.auth.profile,
  queryFn: () => unwrap(api.GET('/profile')),
  staleTime: 60_000,
  refetchOnWindowFocus: true,
  retry: false,
});
