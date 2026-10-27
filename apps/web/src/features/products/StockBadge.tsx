import { Badge } from '@/components/ui/badge';

/** A partir de quantas unidades o estoque é considerado baixo (regra de UI). */
export const LOW_STOCK = 5;

export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) return <Badge variant="destructive">Esgotado</Badge>;
  if (quantity <= LOW_STOCK) {
    return <Badge variant="warning">Baixo · {quantity} un.</Badge>;
  }
  return <span className="tabular-nums">{quantity} un.</span>;
}
