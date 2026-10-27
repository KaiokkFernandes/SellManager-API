import { z } from 'zod';

/**
 * DTOs de resposta levam `.meta({ id })`: geradores de OpenAPI/JSON Schema
 * (como o zod-to-openapi da API) usam o id como nome do componente.
 */

/** Datas trafegam como string ISO 8601 (UTC) no JSON. */
export const isoDateSchema = z.iso.datetime();

/**
 * Padrão de dinheiro da API: **centavos como inteiro**, em campos com sufixo
 * `_cents` (R$ 199,90 -> 19990). Inteiros não têm erro de ponto flutuante e o
 * sufixo deixa a unidade explícita. Formate só na exibição (valor / 100).
 */
export const moneyCentsSchema = z
  .number()
  .int()
  .nonnegative()
  .meta({ description: 'Valor em centavos (inteiro). R$ 199,90 = 19990' });

const EXAMPLE_ID = '5c301fd4-233e-4eac-bb22-994b162e70d2';
const EXAMPLE_DATE = '2026-10-24T20:00:00.000Z';

/** Valores usados nos exemplos do OpenAPI. */
export const examples = { id: EXAMPLE_ID, date: EXAMPLE_DATE } as const;

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

export const validationIssueSchema = z
  .object({
    segment: z.enum(['params', 'query', 'body']),
    path: z.string(),
    message: z.string(),
  })
  .meta({ id: 'ValidationIssue' });

/**
 * Códigos estáveis de erro: o front decide pelo `code`, nunca pelo texto de
 * `message` (que é para humanos e pode mudar).
 */
export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'BAD_REQUEST',
  'INVALID_UPLOAD',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'CONFLICT',
  'ALREADY_EXISTS',
  'INSUFFICIENT_STOCK',
  'RESOURCE_IN_USE',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

/** Formato de todas as respostas de erro da API. */
export const apiErrorSchema = z
  .object({
    status: z.literal('error'),
    code: apiErrorCodeSchema,
    message: z.string(),
    /** Em VALIDATION_FAILED e ALREADY_EXISTS: um item por campo com problema. */
    issues: z.array(validationIssueSchema).optional(),
    /** Dados extras do erro de domínio (ex.: estoque disponível). */
    details: z.unknown().optional(),
  })
  .meta({
    id: 'ApiError',
    example: {
      status: 'error',
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      issues: [
        { segment: 'body', path: 'email', message: 'Invalid email address' },
      ],
    },
  });

export type IdParams = z.infer<typeof idParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
