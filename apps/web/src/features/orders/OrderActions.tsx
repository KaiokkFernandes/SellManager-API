import {
  availableOrderActions,
  cancelOrderBodySchema,
  ORDER_TRANSITIONS,
  type OrderAction,
  type OrderStatus,
} from '@sellmanager/shared';
import { Ban, CreditCard, PackageCheck, Truck } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Form, TextareaField, useZodForm } from '@/components/form';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import { useCan } from '@/features/auth';
import { useOrderAction } from './queries';

const ACTIONS: Record<
  OrderAction,
  {
    label: string;
    title: string;
    description: string;
    icon: ComponentType<{ 'aria-hidden'?: boolean }>;
  }
> = {
  pay: {
    label: 'Registrar pagamento',
    title: 'Registrar pagamento?',
    description: 'O pedido passa para "Pago" e fica pronto para envio.',
    icon: CreditCard,
  },
  ship: {
    label: 'Marcar como enviado',
    title: 'Marcar como enviado?',
    description: 'Depois do envio o pedido não pode mais ser cancelado.',
    icon: Truck,
  },
  deliver: {
    label: 'Marcar como entregue',
    title: 'Marcar como entregue?',
    description: 'O pedido é encerrado e não poderá mais ser alterado.',
    icon: PackageCheck,
  },
  cancel: {
    label: 'Cancelar pedido',
    title: 'Cancelar pedido?',
    description:
      'Os itens voltam ao estoque e o pedido não poderá mais ser alterado.',
    icon: Ban,
  },
};

/**
 * Botões das transições: só as que a tabela do shared permite no status atual
 * E que o papel pode executar. A API valida as duas coisas de novo.
 */
export function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const can = useCan();
  const [action, setAction] = useState<OrderAction | null>(null);
  const actions = availableOrderActions(status).filter(item =>
    can(ORDER_TRANSITIONS[item].permission),
  );

  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(item => {
        const { label, icon: Icon } = ACTIONS[item];
        return (
          <Button
            key={item}
            variant={item === 'cancel' ? 'outline' : 'default'}
            onClick={() => setAction(item)}
          >
            <Icon aria-hidden />
            {label}
          </Button>
        );
      })}
      {action === 'cancel' ? (
        <CancelDialog orderId={orderId} onClose={() => setAction(null)} />
      ) : action ? (
        <TransitionDialog
          orderId={orderId}
          action={action}
          onClose={() => setAction(null)}
        />
      ) : null}
    </div>
  );
}

function TransitionDialog({
  orderId,
  action,
  onClose,
}: {
  orderId: string;
  action: Exclude<OrderAction, 'cancel'>;
  onClose: () => void;
}) {
  const mutation = useOrderAction(orderId);
  const { title, description, label } = ACTIONS[action];
  return (
    <ConfirmDialog
      open
      onOpenChange={open => !open && onClose()}
      title={title}
      description={description}
      confirmLabel={label}
      isPending={mutation.isPending}
      onConfirm={() =>
        mutation.mutate(
          { action },
          {
            onSuccess: onClose,
            onError: error => {
              onClose();
              notify.error(error);
            },
          },
        )
      }
    />
  );
}

function CancelDialog({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const mutation = useOrderAction(orderId);
  // MESMO schema da API: motivo obrigatório (3 a 500 caracteres)
  const form = useZodForm(cancelOrderBodySchema, {
    defaultValues: { reason: '' },
  });
  const { title, description, label } = ACTIONS.cancel;

  const submit = form.handleSubmit(body =>
    mutation.mutate(
      { action: 'cancel', body },
      {
        onSuccess: onClose,
        onError: error => {
          onClose();
          notify.error(error);
        },
      },
    ),
  );

  return (
    <ConfirmDialog
      open
      onOpenChange={open => !open && onClose()}
      title={title}
      description={description}
      confirmLabel={label}
      destructive
      isPending={mutation.isPending}
      onConfirm={() => void submit()}
    >
      <Form form={form} onSubmit={() => void submit()}>
        <TextareaField
          control={form.control}
          name="reason"
          label="Motivo do cancelamento"
          rows={3}
          maxLength={500}
        />
      </Form>
    </ConfirmDialog>
  );
}
