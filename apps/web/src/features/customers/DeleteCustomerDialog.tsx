import { DeleteDialog } from '@/components/confirm-dialog';
import { useDeleteCustomer } from './queries';

interface DeleteCustomerDialogProps {
  customer: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteCustomerDialog({
  customer,
  onOpenChange,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const remove = useDeleteCustomer();
  return (
    <DeleteDialog
      target={customer}
      onOpenChange={onOpenChange}
      onDelete={() => remove.mutateAsync(customer?.id ?? '')}
      onDeleted={onDeleted}
      describeInUse={orders =>
        `Este cliente tem ${orders} ${orders === 1 ? 'pedido' : 'pedidos'} e não pode ser excluído: pedidos são histórico de vendas.`
      }
    />
  );
}
