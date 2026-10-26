import type { Product as ProductResponse } from '@sellmanager/shared';
import { Product } from '../../domain/entities/Product';

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: product.quantity,
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  };
}
