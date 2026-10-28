import { unwrap } from '@sellmanager/api-client';
import type { CreateUserBody, UpdateUserBody } from '@sellmanager/shared';
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
import type { UsersSearch } from './search';

export function useUsersList(params: UsersSearch) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () =>
      unwrap(
        api.GET('/users', {
          params: {
            query: { ...params, page: params.page ?? 1, limit: PAGE_SIZE },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => unwrap(api.GET('/users/{id}', { params: { path: { id } } })),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserBody) => unwrap(api.POST('/users', { body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('Usuário cadastrado. Repasse a senha inicial a ele.');
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateUserBody) =>
      unwrap(api.PUT('/users/{id}', { params: { path: { id } }, body })),
    onSuccess: async user => {
      queryClient.setQueryData(queryKeys.users.detail(id), user);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('Usuário atualizado.');
    },
  });
}

export function useUpdateUserStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) =>
      unwrap(
        api.PATCH('/users/{id}/status', {
          params: { path: { id } },
          body: { active },
        }),
      ),
    onSuccess: async user => {
      queryClient.setQueryData(queryKeys.users.detail(id), user);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success(
        user.active
          ? 'Usuário reativado.'
          : 'Usuário desativado. As sessões dele foram encerradas.',
      );
    },
  });
}
