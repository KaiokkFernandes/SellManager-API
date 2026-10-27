import { ApiClientError } from '@sellmanager/api-client';

export interface StockShortage {
  product_id: string;
  available: number;
  requested: number;
}

/** `details` do 409 INSUFFICIENT_STOCK: uma entrada por produto sem estoque. */
export function getStockShortages(error: unknown): StockShortage[] {
  if (!(error instanceof ApiClientError) || error.code !== 'INSUFFICIENT_STOCK')
    return [];
  return Array.isArray(error.details)
    ? (error.details as unknown[]).filter(
        (item): item is StockShortage =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as StockShortage).product_id === 'string' &&
          typeof (item as StockShortage).available === 'number',
      )
    : [];
}

/** `details.product_ids` do 404 de produtos inexistentes no pedido. */
export function getMissingProductIds(error: unknown): string[] {
  if (!(error instanceof ApiClientError) || error.code !== 'NOT_FOUND')
    return [];
  const ids = (error.details as { product_ids?: unknown } | undefined)
    ?.product_ids;
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === 'string')
    : [];
}
