import { useState } from 'react';
import { getErrorMessage, getInUseOrdersCount } from '@/lib/apiErrors';
import { ConfirmDialog } from './ConfirmDialog';

interface DeleteDialogProps {
  /** O que será excluído; null fecha o diálogo. */
  target: { name: string } | null;
  onOpenChange: (open: boolean) => void;
  /** Executa a exclusão (rejeita com o erro da API). */
  onDelete: () => Promise<unknown>;
  onDeleted?: () => void;
  /** Texto quando a API recusa porque há pedidos (RESOURCE_IN_USE + orders_count). */
  describeInUse: (ordersCount: number) => string;
}

/** Confirmação de exclusão que explica a recusa da API no próprio diálogo. */
export function DeleteDialog({
  target,
  onOpenChange,
  onDelete,
  onDeleted,
  describeInUse,
}: DeleteDialogProps) {
  const [pending, setPending] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  function close() {
    setRefusal(null);
    onOpenChange(false);
  }

  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={open => (open ? onOpenChange(true) : close())}
      title={
        refusal ? 'Não é possível excluir' : `Excluir ${target?.name ?? ''}?`
      }
      description={refusal ?? 'Esta ação não pode ser desfeita.'}
      confirmLabel={refusal ? 'Entendi' : 'Excluir'}
      destructive={!refusal}
      isPending={pending}
      onConfirm={() => {
        if (refusal) return close();
        setPending(true);
        onDelete()
          .then(() => {
            close();
            onDeleted?.();
          })
          .catch((error: unknown) => {
            const orders = getInUseOrdersCount(error);
            setRefusal(
              orders === undefined
                ? getErrorMessage(error)
                : describeInUse(orders),
            );
          })
          .finally(() => setPending(false));
      }}
    />
  );
}
