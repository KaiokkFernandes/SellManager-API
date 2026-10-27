import { SORT_ORDERS } from '@sellmanager/shared';
import { z } from 'zod';

/** Itens por página nas listagens do app. */
export const PAGE_SIZE = 20;

/**
 * Search params de uma listagem (estado na URL: recarregar ou compartilhar o
 * link mantém busca, página e ordenação). Os campos de ordenação vêm do shared;
 * valores inválidos na URL são ignorados em vez de quebrar a tela.
 */
export function listSearchSchema<
  const S extends readonly [string, ...string[]],
>(sorts: S) {
  return z.object({
    q: z.string().trim().max(100).optional().catch(undefined),
    page: z.number().int().positive().optional().catch(undefined),
    sort: z.enum(sorts).optional().catch(undefined),
    order: z.enum(SORT_ORDERS).optional().catch(undefined),
  });
}

/** Converte o campo vindo do cabeçalho da tabela no tipo de ordenação do recurso. */
export function toSort<const S extends readonly string[]>(
  value: string,
  sorts: S,
): S[number] | undefined {
  return sorts.includes(value) ? value : undefined;
}
