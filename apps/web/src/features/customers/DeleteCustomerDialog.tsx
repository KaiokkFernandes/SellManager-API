import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getErrorMessage, getInUseOrdersCount } from '@/lib/apiErrors';
import { useDeleteCustomer } from './queries';

interface DeleteCustomerDialogProps {
  customer: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/** Confirmação de exclusão; explica a recusa da API quando o cliente tem pedidos. */
export function DeleteCustomerDialog({
  customer,
  onOpenChange,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const remove = useDeleteCustomer();
  const [refusal, setRefusal] = useState<string | null>(null);

  function close(open: boolean) {
    if (!open) {
      setRefusal(null);
      remove.reset();
    }
    onOpenChange(open);
  }

  return (
    <ConfirmDialog
      open={customer !== null}
      onOpenChange={close}
      title={
        refusal
          ? 'Não é possível excluir'
          : `Excluir ${customer?.name ?? 'cliente'}?`
      }
      description={
        refusal ?? 'O cadastro será removido. Esta ação não pode ser desfeita.'
      }
      confirmLabel={refusal ? 'Entendi' : 'Excluir'}
      destructive={!refusal}
      isPending={remove.isPending}
      onConfirm={() => {
        if (!customer || refusal) {
          close(false);
          return;
        }
        remove.mutate(customer.id, {
          onSuccess: () => {
            close(false);
            onDeleted?.();
          },
          onError: error => {
            const orders = getInUseOrdersCount(error);
            setRefusal(
              orders === undefined
                ? getErrorMessage(error)
                : `Este cliente tem ${orders} ${orders === 1 ? 'pedido' : 'pedidos'} e não pode ser excluído: pedidos são histórico de vendas.`,
            );
          },
        });
      }}
    />
  );
}
