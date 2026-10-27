import { useBlocker } from '@tanstack/react-router';
import { ConfirmDialog } from '@/components/confirm-dialog';

/**
 * Pede confirmação ao sair (navegação do app ou fechar/recarregar a aba)
 * enquanto `when` for true. Use `when={form.formState.isDirty && !saved}`.
 */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    enableBeforeUnload: () => when,
    withResolver: true,
  });

  return (
    <ConfirmDialog
      open={blocker.status === 'blocked'}
      onOpenChange={open => {
        if (!open) blocker.reset?.();
      }}
      title="Descartar alterações?"
      description="Você tem alterações não salvas. Se sair agora, elas serão perdidas."
      confirmLabel="Sair sem salvar"
      destructive
      onConfirm={() => blocker.proceed?.()}
    />
  );
}
