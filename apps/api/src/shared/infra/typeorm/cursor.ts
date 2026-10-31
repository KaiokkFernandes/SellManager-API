import { DataSource } from 'typeorm';

/**
 * Lê o resultado aos poucos com um cursor do Postgres (DECLARE/FETCH), em
 * lotes: a memória fica constante seja qual for o tamanho do relatório. A
 * transação REPEATABLE READ dá uma foto consistente do começo ao fim.
 * Se quem consome parar (cliente desconectou), o finally fecha tudo.
 */
export async function* streamRows<T>(
  dataSource: DataSource,
  sql: string,
  params: unknown[],
  batchSize = 500,
): AsyncGenerator<T> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await runner.startTransaction('REPEATABLE READ');
    await runner.query(
      `DECLARE report_cursor NO SCROLL CURSOR FOR ${sql}`,
      params,
    );
    for (;;) {
      const rows = (await runner.query(
        `FETCH ${batchSize} FROM report_cursor`,
      )) as T[];
      if (rows.length === 0) break;
      yield* rows;
    }
    await runner.commitTransaction();
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    await runner.release();
  }
}
