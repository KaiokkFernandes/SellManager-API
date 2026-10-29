import { PRODUCT_SORTS } from '@sellmanager/shared';
import { z } from 'zod';
import { listSearchSchema } from '@/lib/listSearch';

/** Estado da lista de produtos na URL: ?q=&category_id=&page=&sort=&order= */
export const productsSearchSchema = listSearchSchema(PRODUCT_SORTS).extend({
  category_id: z.uuid().optional().catch(undefined),
});

/** Edição do produto na URL: ?tab=movements&page= (página das movimentações) */
export const editProductSearchSchema = z.object({
  tab: z.enum(['data', 'movements']).optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
});

/** Página de estoque baixo: ?page= */
export const lowStockSearchSchema = z.object({
  page: z.number().int().positive().optional().catch(undefined),
});
