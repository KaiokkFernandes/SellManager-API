/**
 * Conversão de dinheiro na borda HTTP. O contrato usa centavos inteiros
 * (`*_cents`); domínio e banco seguem com decimal de 2 casas.
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
