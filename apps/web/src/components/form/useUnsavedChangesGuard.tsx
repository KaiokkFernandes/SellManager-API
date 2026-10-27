import { useBlocker } from '@tanstack/react-router';
import { useRef } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';

/**
 * Pede confirmação ao sair (navegação do app ou fechar/recarregar a aba)
 * enquanto `isDirty`. Renderize `dialog` e chame `allowNavigation()` logo antes
 * de navegar após salvar com sucesso.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const allowed = useRef(false);
  const shouldBlock = () => isDirty && !allowed.current;
  const blocker = useBlocker({
    shouldBlockFn: shouldBlock,
    enableBeforeUnload: shouldBlock,
    withResolver: true,
  });

  const dialog = (
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

  return {
    dialog,
    allowNavigation: () => {
      allowed.current = true;
    },
  };
}
