import { useState } from 'react';
import { getErrorMessage, getInUseCount } from '@/lib/apiErrors';
import { ConfirmDialog } from './ConfirmDialog';

interface DeleteDialogProps {
  /** O que será excluído; null fecha o diálogo. */
  target: { name: string } | null;
  onOpenChange: (open: boolean) => void;
  /** Executa a exclusão (rejeita com o erro da API). */
  onDelete: () => Promise<unknown>;
  onDeleted?: () => void;
  /** Texto quando a API recusa porque o item está em uso (RESOURCE_IN_USE). */
  describeInUse: (count: number) => string;
  /** Qual contagem o RESOURCE_IN_USE traz (padrão: pedidos). */
  inUseKey?: 'orders_count' | 'products_count';
}

/** Confirmação de exclusão que explica a recusa da API no próprio diálogo. */
export function DeleteDialog({
  target,
  onOpenChange,
  onDelete,
  onDeleted,
  describeInUse,
  inUseKey,
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
            const count = getInUseCount(error, inUseKey);
            setRefusal(
              count === undefined
                ? getErrorMessage(error)
                : describeInUse(count),
            );
          })
          .finally(() => setPending(false));
      }}
    />
  );
}
