import type {
  Product as ProductResponse,
  StockMovement as StockMovementResponse,
} from '@sellmanager/shared';
import { toCents } from '@shared/http/money';
import { isBelowMinStock, Product } from '../../domain/entities/Product';
import { StockMovement } from '../../domain/entities/StockMovement';

export function toProductResponse(
  product: Product,
  apiUrl: string,
): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    price_cents: toCents(product.price),
    quantity: product.quantity,
    min_stock: product.min_stock,
    below_min_stock: isBelowMinStock(product),
    category: product.category ? { ...product.category } : null,
    image_url: product.image ? `${apiUrl}/files/${product.image}` : null,
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  };
}

export function toStockMovementResponse(
  movement: StockMovement,
): StockMovementResponse {
  return {
    id: movement.id,
    product_id: movement.product_id,
    type: movement.type,
    quantity: movement.quantity,
    balance_after: movement.balance_after,
    reason: movement.reason,
    order_id: movement.order_id,
    created_by: movement.created_by ? { ...movement.created_by } : null,
    created_at: movement.created_at.toISOString(),
  };
}
