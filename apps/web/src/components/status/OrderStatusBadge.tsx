import type { OrderStatus } from '@sellmanager/shared';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS } from './orderStatusLabels';

const VARIANT = {
  pending: 'warning',
  paid: 'default',
  shipped: 'default',
  delivered: 'success',
  canceled: 'outline',
} as const;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
