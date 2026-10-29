import { z } from 'zod';
import {
  examples,
  isoDateSchema,
  paginationQuerySchema,
  searchSchema,
} from './common';

export const categoryBodySchema = z
  .object({ name: z.string().trim().min(1).max(60) })
  .meta({ id: 'CategoryBody', example: { name: 'Periféricos' } });

export type CategoryBody = z.infer<typeof categoryBodySchema>;

export const listCategoriesQuerySchema = paginationQuerySchema.extend({
  q: searchSchema.meta({ description: 'Busca por nome' }),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const categorySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    products_count: z.number().int().describe('Produtos na categoria'),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({
    id: 'Category',
    example: {
      id: examples.id,
      name: 'Periféricos',
      products_count: 12,
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export type Category = z.infer<typeof categorySchema>;

/** Resumo embutido no produto. */
export const productCategorySchema = z
  .object({ id: z.uuid(), name: z.string() })
  .meta({ id: 'ProductCategory' });
export type ProductCategory = z.infer<typeof productCategorySchema>;
