import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@shared/http/createApp';
import { closeDatabase, createTestContext, TestContext } from './helpers';

describe('Aplicação', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(closeDatabase);

  it('rota inexistente responde 404 em JSON', async () => {
    const response = await request(ctx.app).get('/nao-existe').expect(404);
    expect(response.body).toEqual({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Route GET /nao-existe not found',
    });
  });

  it('JSON malformado responde 400 sem repetir o que foi enviado', async () => {
    const response = await request(ctx.app)
      .post('/sessions')
      .set('Content-Type', 'application/json')
      .send('{"password": segredo-digitado}')
      .expect(400);
    expect(response.body).toEqual({
      status: 'error',
      code: 'BAD_REQUEST',
      message: 'Malformed JSON body',
    });
  });

  it('sem banco, responde 503 no formato do contrato e sem detalhes', async () => {
    const app = createApp({
      ...ctx.container,
      database: {
        ready: () => Promise.reject(new Error('senha incorreta no host x')),
        ping: () => Promise.reject(new Error('senha incorreta no host x')),
      },
    });

    const response = await request(app).get('/products').expect(503);

    expect(response.body).toEqual({
      status: 'error',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
    });
  });

  it('serve a documentação OpenAPI', async () => {
    const response = await request(ctx.app).get('/docs.json').expect(200);
    expect(response.body.openapi).toBe('3.1.0');
    await request(ctx.app).get('/docs/').expect(200);
  });

  it('em produção a documentação não é servida', async () => {
    const app = createApp(ctx.container, { docs: false });

    await request(app).get('/docs.json').expect(404);
    await request(app).get('/docs/').expect(404);
  });

  it('envia headers de segurança', async () => {
    const response = await request(ctx.app).get('/docs.json').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
