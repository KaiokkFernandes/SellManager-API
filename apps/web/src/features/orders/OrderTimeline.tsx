import type { OrderStatusChange } from '@sellmanager/api-client';
import { ORDER_STATUS_LABELS } from '@/components/status/orderStatusLabels';
import { formatDateTime } from '@/lib/format';

/** Histórico de status do pedido: quem, quando, de/para e o motivo. */
export function OrderTimeline({ history }: { history: OrderStatusChange[] }) {
  return (
    <ol aria-label="Histórico do pedido" className="relative space-y-4">
      {history.map((change, index) => (
        <li key={change.id} className="relative flex gap-3">
          <span
            aria-hidden="true"
            className="mt-1.5 flex size-2.5 shrink-0 rounded-full bg-primary"
          />
          {index < history.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-4 left-[4.5px] h-[calc(100%-0.25rem)] w-px bg-border"
            />
          ) : null}
          <div className="min-w-0 space-y-0.5 text-sm">
            <p className="font-medium">
              {change.from_status
                ? `${ORDER_STATUS_LABELS[change.from_status]} → ${ORDER_STATUS_LABELS[change.to_status]}`
                : 'Pedido criado'}
            </p>
            <p className="text-muted-foreground">
              <time dateTime={change.created_at}>
                {formatDateTime(change.created_at)}
              </time>
              {' · '}
              {change.changed_by?.name ?? 'Registro anterior ao histórico'}
            </p>
            {change.reason ? (
              <p className="break-words">Motivo: {change.reason}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
