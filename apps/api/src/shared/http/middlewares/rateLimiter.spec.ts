import express, { Express } from 'express';
import { MemoryStore } from 'express-rate-limit';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createAuthRateLimiter } from './rateLimiter';

function appWith(limiter: express.RequestHandler): Express {
  const app = express();
  // como na Vercel: um proxy à frente, que informa o IP real
  app.set('trust proxy', 1);
  app.post('/sessions', limiter, (_request, response) => {
    response.sendStatus(200);
  });
  app.post('/password/forgot', limiter, (_request, response) => {
    response.sendStatus(200);
  });
  return app;
}

const from = (app: Express, path: string, ip: string) =>
  request(app).post(path).set('X-Forwarded-For', ip);

describe('createAuthRateLimiter', () => {
  it('bloqueia acima do limite, no formato de erro do contrato', async () => {
    const app = appWith(createAuthRateLimiter({ limit: 2, skip: false }));

    await from(app, '/sessions', '203.0.113.1').expect(200);
    await from(app, '/sessions', '203.0.113.1').expect(200);
    const blocked = await from(app, '/sessions', '203.0.113.1').expect(429);

    expect(blocked.body).toMatchObject({
      status: 'error',
      code: 'RATE_LIMITED',
    });
  });

  it('cada IP real tem o próprio contador atrás do proxy', async () => {
    const app = appWith(createAuthRateLimiter({ limit: 1, skip: false }));

    await from(app, '/sessions', '203.0.113.1').expect(200);
    await from(app, '/sessions', '203.0.113.1').expect(429);
    await from(app, '/sessions', '203.0.113.2').expect(200);
  });

  it('cada rota tem o próprio contador', async () => {
    const app = appWith(createAuthRateLimiter({ limit: 1, skip: false }));

    await from(app, '/sessions', '203.0.113.1').expect(200);
    await from(app, '/sessions', '203.0.113.1').expect(429);
    await from(app, '/password/forgot', '203.0.113.1').expect(200);
  });

  it('usa o store compartilhado e, se ele falhar, libera a requisição', async () => {
    const store = new MemoryStore();
    const increment = vi
      .spyOn(store, 'increment')
      .mockRejectedValue(new Error('redis caiu'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = appWith(
      createAuthRateLimiter({ limit: 1, skip: false, store }),
    );

    await from(app, '/sessions', '203.0.113.1').expect(200);
    await from(app, '/sessions', '203.0.113.1').expect(200);

    expect(increment).toHaveBeenCalledTimes(2);
  });
});
