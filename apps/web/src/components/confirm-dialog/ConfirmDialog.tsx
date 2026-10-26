import { AlertDialog } from 'radix-ui';
import { Loader2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Estilo vermelho para ações destrutivas (excluir, cancelar pedido). */
  destructive?: boolean;
  /** Mantém o diálogo aberto e desabilita os botões enquanto a ação roda. */
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmação de ação. Radix AlertDialog: foco preso, Esc cancela, foco inicial
 * no botão "Cancelar" (a opção segura).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive,
  isPending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-card p-6 shadow-lg">
          <div className="grid gap-2">
            <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              disabled={isPending}
              className={buttonVariants({ variant: 'outline' })}
            >
              Cancelar
            </AlertDialog.Cancel>
            <AlertDialog.Action
              disabled={isPending}
              onClick={event => {
                // não fecha sozinho: quem chama fecha quando a ação terminar
                event.preventDefault();
                onConfirm();
              }}
              className={cn(buttonVariants({ variant: destructive ? 'destructive' : 'default' }))}
            >
              {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
