const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Centavos inteiros (formato do contrato) -> "R$ 1.234,56". */
export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

/** Texto digitado ("1.234,56" ou "12,5") -> centavos inteiros; null se inválido. */
export function parseCents(input: string): number | null {
  const normalized = input
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  if (normalized === '' || !/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Centavos -> texto editável no padrão pt-BR ("1234,56"), sem símbolo. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** ISO 8601 da API -> "26/10/2026". */
export function formatDate(iso: string): string {
  return date.format(new Date(iso));
}

/** ISO 8601 da API -> "26/10/2026 14:30". */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** Centavos -> "R$ 12,3 mil" (eixos de gráfico, telas estreitas). */
export function formatCentsCompact(cents: number): string {
  return compactCurrency.format(cents / 100);
}

/** Proporção (0.125) -> "12,5%". */
export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

/** Dia local "AAAA-MM-DD" -> "26/10/2026" (sem passar por fuso). */
export function formatLocalDay(day: string): string {
  const [year, month, dayOfMonth] = day.split('-');
  return `${dayOfMonth}/${month}/${year}`;
}
