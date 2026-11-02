import { describe, expect, it, vi } from 'vitest';
import { createRateLimitStore } from '@shared/infra/redis/rateLimitStore';
import { makeContainer } from '.';

vi.mock('@shared/infra/redis/rateLimitStore', () => ({
  createRateLimitStore: vi.fn(() => ({})),
}));
vi.mock('@config/env', async importOriginal => {
  const original = await importOriginal<typeof import('@config/env')>();
  return { env: { ...original.env, REDIS_URL: 'redis://localhost:6379' } };
});

describe('makeContainer', () => {
  it('não abre o Redis ao montar: prenderia comandos como o create-admin', () => {
    const container = makeContainer({ getRepository: () => ({}) } as never);

    expect(createRateLimitStore).not.toHaveBeenCalled();

    container.makeRateLimitStore();
    expect(createRateLimitStore).toHaveBeenCalledWith('redis://localhost:6379');
  });
});
