import { unwrap } from '@sellmanager/api-client';
import type {
  ChangePasswordBody,
  UpdateProfileBody,
} from '@sellmanager/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { queryKeys } from '@/lib/queryKeys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) =>
      unwrap(api.PUT('/profile', { body })),
    onSuccess: async user => {
      queryClient.setQueryData(queryKeys.auth.profile, user);
      // a lista de usuários mostra o nome
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('Perfil atualizado.');
    },
  });
}

/** A API encerra as outras sessões e devolve um token novo para esta. */
export function useChangePassword() {
  const { replaceSession } = useAuth();
  return useMutation({
    mutationFn: (body: ChangePasswordBody) =>
      unwrap(api.PUT('/profile/password', { body })),
    onSuccess: session => {
      replaceSession(session);
      notify.success('Senha alterada. As outras sessões foram encerradas.');
    },
  });
}
