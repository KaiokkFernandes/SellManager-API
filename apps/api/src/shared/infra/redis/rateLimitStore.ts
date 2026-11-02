import type { Store } from 'express-rate-limit';
import { Redis } from 'ioredis';
import { RedisReply, RedisStore } from 'rate-limit-redis';
import { logger } from '@shared/logger';

/**
 * Contador do rate limit no Redis: em serverless cada instância tem a própria
 * memória, e o limite real se multiplicaria. Uma tentativa só por comando e
 * conexão com tempo curto: Redis lento não pode segurar o login.
 */
export function createRateLimitStore(url: string): Store {
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3_000,
  });
  // sem este listener, um erro de conexão derrubaria o processo
  client.on('error', error => {
    logger.error({ err: error }, 'Falha na conexão com o Redis');
  });

  return new RedisStore({
    prefix: 'sellmanager:rate-limit:',
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
  });
}
