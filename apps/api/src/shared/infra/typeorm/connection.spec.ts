import { describe, expect, it, vi } from 'vitest';
import { createDatabaseConnection } from './connection';

function fakeDataSource(initialize: () => Promise<void>) {
  const source = {
    isInitialized: false,
    query: vi.fn(() => Promise.resolve([])),
    initialize: vi.fn(async () => {
      await initialize();
      source.isInitialized = true;
    }),
  };
  return source;
}

describe('createDatabaseConnection', () => {
  it('chamadas simultâneas inicializam uma vez só', async () => {
    const source = fakeDataSource(() => Promise.resolve());
    const connection = createDatabaseConnection(source);

    await Promise.all([
      connection.ready(),
      connection.ready(),
      connection.ping(),
    ]);
    await connection.ready();

    expect(source.initialize).toHaveBeenCalledTimes(1);
    expect(source.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('depois de uma falha, a próxima chamada tenta de novo', async () => {
    const attempts = [Promise.reject(new Error('fora do ar'))];
    const source = fakeDataSource(() => attempts.shift() ?? Promise.resolve());
    const connection = createDatabaseConnection(source);

    await expect(connection.ready()).rejects.toThrow('fora do ar');
    await connection.ready();

    expect(source.initialize).toHaveBeenCalledTimes(2);
  });
});
