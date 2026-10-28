/**
 * Motivos das validações que não são do zod (refine). O schema declara só o
 * MOTIVO (`params.reason`); cada lado escolhe o texto: a API responde em inglês
 * e o front mostra em pt-BR, sem duplicar a regra.
 */
/** Texto padrão (inglês), usado pela API. */
export const VALIDATION_REASONS = {
  password_mismatch: 'Passwords do not match',
  same_password: 'The new password must be different from the current one',
  inverted_range: '`to` must be after `from`',
  zero_quantity: 'Quantity must not be zero',
  negative_entry: 'An entry must have a positive quantity',
  reason_required: 'A reason is required',
} as const;

export type ValidationReason = keyof typeof VALIDATION_REASONS;

/**
 * Opções de `.refine()` com o motivo e SEM mensagem fixa (mensagem no schema
 * teria precedência sobre a configuração de idioma de cada app).
 */
export function because(reason: ValidationReason, path: string) {
  return { path: [path], params: { reason } };
}

export function validationReason(
  params: unknown,
): ValidationReason | undefined {
  const reason = (params as { reason?: unknown } | undefined)?.reason;
  return typeof reason === 'string' && reason in VALIDATION_REASONS
    ? (reason as ValidationReason)
    : undefined;
}
