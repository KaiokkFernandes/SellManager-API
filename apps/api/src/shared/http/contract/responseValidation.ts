import type { ZodType } from 'zod';
import { env } from '@config/env';
import { logger } from '@shared/logger';

/**
 * strict (teste): divergência vira erro 500, e o teste quebra.
 * warn (desenvolvimento): loga a divergência e envia a resposta mesmo assim.
 * off (produção): não valida nada.
 */
export type ResponseValidationMode = 'strict' | 'warn' | 'off';

export const responseValidationMode: ResponseValidationMode = (
  { test: 'strict', development: 'warn', production: 'off' } as const
)[env.NODE_ENV];

export class ContractViolationError extends Error {
  constructor(
    public readonly operationId: string,
    public readonly status: number,
    public readonly problems: string[],
  ) {
    super(
      `Resposta de ${operationId} (${status}) fora do contrato: ${problems.join('; ')}`,
    );
    this.name = 'ContractViolationError';
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortKeys(item)]),
    );
  }
  return value;
}

/**
 * Confere o corpo contra o schema. Além dos erros do zod, acusa campos que o
 * schema não declara (o zod os descartaria em silêncio, e um campo vazado,
 * como o hash da senha, passaria despercebido).
 */
export function checkResponse(
  schema: ZodType,
  body: unknown,
  { operationId, status }: { operationId: string; status: number },
  mode: ResponseValidationMode,
): void {
  if (mode === 'off') return;

  // compara a forma JSON, que é o que o cliente recebe
  const sent: unknown = JSON.parse(JSON.stringify(body ?? null));
  const result = schema.safeParse(sent);
  const problems = result.success
    ? JSON.stringify(sortKeys(result.data)) === JSON.stringify(sortKeys(sent))
      ? []
      : ['contém campos que o contrato não declara']
    : result.error.issues.map(
        issue => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`,
      );

  if (problems.length === 0) return;

  const violation = new ContractViolationError(operationId, status, problems);
  if (mode === 'strict') throw violation;
  logger.error({ err: violation }, 'Resposta fora do contrato');
}
