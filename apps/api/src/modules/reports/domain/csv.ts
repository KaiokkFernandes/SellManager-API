/**
 * CSV que o Excel em português abre direto: UTF-8 com BOM (acentos), ";"
 * como separador, CRLF, vírgula decimal sem separador de milhar (o Excel
 * soma) e datas dd/mm/aaaa hh:mm no fuso do negócio.
 */
export const BOM = '\uFEFF';
const SEPARATOR = ';';
const EOL = '\r\n';

export type CsvValue = string | number | Date | null;

export interface CsvColumn<T> {
  header: string;
  kind: 'text' | 'int' | 'money' | 'datetime';
  value: (row: T) => CsvValue;
}

/** Texto: protege contra fórmula (=, +, -, @) e escapa ; " e quebras. */
function text(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Centavos -> "1234,56". */
export function money(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

export function dateTime(value: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function cell<T>(column: CsvColumn<T>, row: T, timezone: string): string {
  const value = column.value(row);
  if (value === null) return '';
  switch (column.kind) {
    case 'money':
      return money(Number(value));
    case 'int':
      return String(Math.trunc(Number(value)));
    case 'datetime':
      return dateTime(
        value instanceof Date ? value : new Date(value),
        timezone,
      );
    case 'text':
      return text(String(value));
  }
}

/** Linhas do arquivo (BOM + cabeçalho + uma por registro), geradas sob demanda. */
export async function* toCsv<T>(
  columns: readonly CsvColumn<T>[],
  rows: AsyncIterable<T>,
  timezone: string,
): AsyncGenerator<string> {
  yield BOM + columns.map(column => text(column.header)).join(SEPARATOR) + EOL;
  for await (const row of rows) {
    yield columns.map(column => cell(column, row, timezone)).join(SEPARATOR) +
      EOL;
  }
}

/** vendas_2026-10-01_a_2026-10-31.csv */
export function reportFilename(
  prefix: string,
  { from, to }: { from: string; to: string },
): string {
  return `${prefix}_${from}_a_${to}.csv`;
}
