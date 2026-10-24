import { z } from 'zod';

/**
 * DTOs de resposta levam `.meta({ id })`: geradores de OpenAPI/JSON Schema
 * (como o zod-to-openapi da API) usam o id como nome do componente.
 */

/** Datas trafegam como string ISO 8601 no JSON. */
export const isoDateSchema = z.iso.datetime();

export const idParamsSchema = z.object({
  id: z.uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
});

/** Envelope das listagens: { data: T[], meta }. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema });
}

export const validationIssueSchema = z.object({
  segment: z.enum(['params', 'query', 'body']),
  path: z.string(),
  message: z.string(),
});

/** Formato de todas as respostas de erro da API. */
export const apiErrorSchema = z
  .object({
    status: z.literal('error'),
    message: z.string(),
    details: z.unknown().optional(),
  })
  .meta({ id: 'ApiError' });

export type IdParams = z.infer<typeof idParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
