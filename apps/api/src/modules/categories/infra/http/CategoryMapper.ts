import type { Category as CategoryResponse } from '@sellmanager/shared';
import { Category } from '../../domain/entities/Category';

export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    products_count: category.products_count,
    created_at: category.created_at.toISOString(),
    updated_at: category.updated_at.toISOString(),
  };
}
