import type { Product } from '@sellmanager/api-client';
import { Badge } from '@/components/ui/badge';

/** Destaque do estoque: "abaixo do mínimo" vem da API (regra do domínio). */
export function StockBadge({
  product: { quantity, min_stock, below_min_stock },
}: {
  product: Pick<Product, 'quantity' | 'min_stock' | 'below_min_stock'>;
}) {
  if (quantity === 0) return <Badge variant="destructive">Esgotado</Badge>;
  if (below_min_stock) {
    return (
      <Badge variant="warning" title={`Estoque mínimo: ${min_stock} un.`}>
        Baixo · {quantity} un.
      </Badge>
    );
  }
  return <span className="tabular-nums">{quantity} un.</span>;
}
