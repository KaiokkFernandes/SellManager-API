import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  ResponseConfig,
} from '@asteasolutions/zod-to-openapi';
import { z, ZodType } from 'zod';

// Adiciona .openapi() aos schemas zod (usado pelo registry.register).
extendZodWithOpenApi(z);

export const bearerAuth = [{ bearerAuth: [] }];

export const errorSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  details: z.unknown().optional(),
});

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
});

export const idParam = z.object({ id: z.uuid() });

export function json(schema: ZodType, description = 'OK'): ResponseConfig {
  return { description, content: { 'application/json': { schema } } };
}

export function body(schema: ZodType) {
  return { content: { 'application/json': { schema } }, required: true };
}

export function paginated(schema: ZodType) {
  return z.object({ data: z.array(schema), meta: paginationMetaSchema });
}

export const errors = {
  400: json(errorSchema, 'Dados inválidos'),
  401: json(errorSchema, 'Não autenticado'),
  404: json(errorSchema, 'Não encontrado'),
  409: json(errorSchema, 'Conflito'),
  429: json(errorSchema, 'Muitas requisições'),
};

export const noContent: ResponseConfig = { description: 'Sem conteúdo' };

export type DocsRegistry = OpenAPIRegistry;
