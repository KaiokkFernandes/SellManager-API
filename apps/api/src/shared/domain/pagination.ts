import type { Paginated } from '@sellmanager/shared';

export type { Paginated };

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}

export const DEFAULT_PAGINATION: PaginationParams = { page: 1, limit: 20 };

export function toSkipTake({ page, limit }: PaginationParams) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginate<T>(
  { items, total }: PageResult<T>,
  { page, limit }: PaginationParams,
): Paginated<T> {
  return {
    data: items,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

/** Aplica a paginação em memória (usado pelos repositórios fake). */
export function slicePage<T>(
  items: T[],
  { page, limit }: PaginationParams,
): PageResult<T> {
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total: items.length };
}
