import { DeleteDialog } from '@/components/confirm-dialog';
import { useDeleteProduct } from './queries';

interface DeleteProductDialogProps {
  product: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteProductDialog({
  product,
  onOpenChange,
  onDeleted,
}: DeleteProductDialogProps) {
  const remove = useDeleteProduct();
  return (
    <DeleteDialog
      target={product}
      onOpenChange={onOpenChange}
      onDelete={() => remove.mutateAsync(product?.id ?? '')}
      onDeleted={onDeleted}
      describeInUse={orders =>
        `Este produto está em ${orders} ${orders === 1 ? 'pedido' : 'pedidos'} e não pode ser excluído. Para tirá-lo de venda, zere o estoque.`
      }
    />
  );
}
