import type { User } from '@sellmanager/api-client';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getAdminGuardMessage, getErrorMessage } from '@/lib/apiErrors';
import { useUpdateUserStatus } from './queries';

interface UserStatusDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

/** Confirma ativar/desativar; mostra no diálogo a recusa da API (si mesmo, último ADMIN). */
export function UserStatusDialog({
  user,
  onOpenChange,
}: UserStatusDialogProps) {
  const update = useUpdateUserStatus(user?.id ?? '');
  const [refusal, setRefusal] = useState<string | null>(null);
  const deactivating = user?.active ?? false;

  function close() {
    setRefusal(null);
    update.reset();
    onOpenChange(false);
  }

  return (
    <ConfirmDialog
      open={user !== null}
      onOpenChange={open => (open ? onOpenChange(true) : close())}
      title={
        refusal
          ? 'Não é possível alterar'
          : deactivating
            ? `Desativar ${user?.name ?? ''}?`
            : `Reativar ${user?.name ?? ''}?`
      }
      description={
        refusal ??
        (deactivating
          ? 'A pessoa sai na hora de todas as sessões e não consegue mais entrar. Nada é excluído e dá para reativar depois.'
          : 'A pessoa volta a entrar com a senha que já tinha.')
      }
      confirmLabel={
        refusal ? 'Entendi' : deactivating ? 'Desativar' : 'Reativar'
      }
      destructive={!refusal && deactivating}
      isPending={update.isPending}
      onConfirm={() => {
        if (!user || refusal) return close();
        update.mutate(!user.active, {
          onSuccess: close,
          onError: error =>
            setRefusal(getAdminGuardMessage(error) ?? getErrorMessage(error)),
        });
      }}
    />
  );
}
