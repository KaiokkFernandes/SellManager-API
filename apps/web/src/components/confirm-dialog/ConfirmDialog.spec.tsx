import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const props = {
  title: 'Excluir produto?',
  description: 'Esta ação não pode ser desfeita.',
  confirmLabel: 'Excluir',
};

describe('ConfirmDialog', () => {
  it('é um alertdialog acessível, confirma e não fecha sozinho', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...props}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        destructive
      />,
    );

    const dialog = screen.getByRole('alertdialog', {
      name: 'Excluir produto?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'Esta ação não pode ser desfeita.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('Esc e Cancelar pedem para fechar sem confirmar', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...props}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
    const typing = userEvent.setup();

    await typing.keyboard('{Escape}');
    await typing.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('desabilita os botões enquanto a ação roda', () => {
    render(
      <ConfirmDialog
        {...props}
        open
        isPending
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
