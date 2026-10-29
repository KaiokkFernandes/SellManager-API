import { z } from 'zod';

/** Estado da lista de categorias na URL: ?q=&page= */
export const categoriesSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
});
