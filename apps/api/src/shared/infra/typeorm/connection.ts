export interface IDatabaseConnection {
  /** Garante a conexão. Em caso de falha, a próxima chamada tenta de novo. */
  ready(): Promise<void>;
  /** Confere que o banco responde. */
  ping(): Promise<void>;
}

/**
 * Inicialização preguiçosa do DataSource: em serverless o módulo sobrevive
 * entre invocações, então a conexão nasce na primeira requisição e é
 * reaproveitada. Chamadas simultâneas esperam a mesma inicialização.
 */
export function createDatabaseConnection(dataSource: {
  readonly isInitialized: boolean;
  initialize(): Promise<unknown>;
  query(sql: string): Promise<unknown>;
}): IDatabaseConnection {
  let pending: Promise<unknown> | undefined;

  const ready = async () => {
    if (dataSource.isInitialized) return;
    pending ??= dataSource.initialize().finally(() => {
      pending = undefined;
    });
    await pending;
  };

  return {
    ready,
    async ping() {
      await ready();
      await dataSource.query('SELECT 1');
    },
  };
}
