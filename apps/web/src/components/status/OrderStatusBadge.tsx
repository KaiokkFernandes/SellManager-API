import type { OrderStatus } from '@sellmanager/shared';
import { Badge } from '@/components/ui/badge';

const LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  canceled: 'Cancelado',
};

const VARIANT = {
  pending: 'warning',
  completed: 'success',
  canceled: 'outline',
} as const;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
