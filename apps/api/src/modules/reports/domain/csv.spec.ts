import { describe, expect, it } from 'vitest';
import {
  BOM,
  dateTime,
  money,
  reportFilename,
  toCsv,
  type CsvColumn,
} from './csv';

async function collect(lines: AsyncIterable<string>): Promise<string> {
  let out = '';
  for await (const line of lines) out += line;
  return out;
}

async function* from<T>(rows: T[]) {
  for (const row of rows) {
    await Promise.resolve();
    yield row;
  }
}

describe('CSV para Excel em pt-BR', () => {
  it('dinheiro com vírgula decimal e sem separador de milhar', () => {
    expect(money(123456)).toBe('1234,56');
    expect(money(5)).toBe('0,05');
    expect(money(-1999)).toBe('-19,99');
  });

  it('data dd/mm/aaaa hh:mm no fuso do negócio', () => {
    // 01/11 02:30 UTC = 31/10 23:30 em São Paulo
    expect(
      dateTime(new Date('2026-11-01T02:30:00Z'), 'America/Sao_Paulo'),
    ).toBe('31/10/2026 23:30');
  });

  it('BOM, ";", CRLF, acentos, aspas e proteção contra fórmula', async () => {
    type Row = { name: string; total: number; at: Date | null };
    const columns: CsvColumn<Row>[] = [
      { header: 'Cliente', kind: 'text', value: row => row.name },
      { header: 'Total (R$)', kind: 'money', value: row => row.total },
      { header: 'Data', kind: 'datetime', value: row => row.at },
    ];
    const csv = await collect(
      toCsv(
        columns,
        from<Row>([
          {
            name: 'João; "Jô"',
            total: 1050,
            at: new Date('2026-10-10T15:00:00Z'),
          },
          { name: '=HYPERLINK("x")', total: 0, at: null },
        ]),
        'America/Sao_Paulo',
      ),
    );

    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Cliente;Total (R$);Data',
      '"João; ""Jô""";10,50;10/10/2026 12:00',
      `"'=HYPERLINK(""x"")";0,00;`,
      '',
    ]);
  });

  it('nome do arquivo com o período', () => {
    expect(
      reportFilename('vendas', { from: '2026-10-01', to: '2026-10-31' }),
    ).toBe('vendas_2026-10-01_a_2026-10-31.csv');
  });
});
