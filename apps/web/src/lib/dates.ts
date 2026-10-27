/**
 * Datas de filtro chegam como dia local ("2026-10-01", do <input type="date">)
 * e vão para a API como instantes: o fuso do usuário define onde o dia começa.
 */
function parseLocalDay(day: string): Date {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/** Início do dia local, em ISO 8601 (limite inclusivo `from` da API). */
export function startOfLocalDay(day: string): string {
  return parseLocalDay(day).toISOString();
}

/** Início do dia local SEGUINTE (limite exclusivo `to`): inclui o dia inteiro. */
export function startOfNextLocalDay(day: string): string {
  const next = parseLocalDay(day);
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}
