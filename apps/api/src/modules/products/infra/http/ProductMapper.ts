import type { Product as ProductResponse } from '@sellmanager/shared';
import { toCents } from '@shared/http/money';
import { Product } from '../../domain/entities/Product';

export function toProductResponse(
  product: Product,
  apiUrl: string,
): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    price_cents: toCents(product.price),
    quantity: product.quantity,
    image_url: product.image ? `${apiUrl}/files/${product.image}` : null,
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  };
}
