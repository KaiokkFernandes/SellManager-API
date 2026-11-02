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
    const response = await request(ctx.app).get('/api/nao-existe').expect(404);
    expect(response.body).toEqual({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Route GET /api/nao-existe not found',
    });
  });

  it('JSON malformado responde 400 sem repetir o que foi enviado', async () => {
    const response = await request(ctx.app)
      .post('/api/sessions')
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

    const response = await request(app).get('/api/products').expect(503);

    expect(response.body).toEqual({
      status: 'error',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
    });
  });

  it('/api/health confere o banco', async () => {
    const response = await request(ctx.app).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('/api/health responde 503 quando a consulta ao banco falha', async () => {
    const app = createApp({
      ...ctx.container,
      database: {
        ready: () => Promise.resolve(),
        ping: () => Promise.reject(new Error('conexão perdida')),
      },
    });

    const response = await request(app).get('/api/health').expect(503);

    expect(response.body).toEqual({
      status: 'error',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
    });
  });

  it('as rotas só existem sob /api', async () => {
    await request(ctx.app).get('/health').expect(404);
    await request(ctx.app).post('/sessions').send({}).expect(404);
  });

  describe('política de origem', () => {
    const app = () =>
      createApp(ctx.container, {
        corsOrigins: ['https://parceiro.exemplo.com'],
      });

    it('recusa origem não permitida antes de executar a rota', async () => {
      const response = await request(app())
        .post('/api/sessions')
        .set('Origin', 'https://site-malicioso.exemplo.com')
        .send({ email: 'a@b.com', password: 'x' })
        .expect(403);

      expect(response.body).toMatchObject({ code: 'FORBIDDEN' });
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('aceita a origem igual ao host, sem configurar CORS_ORIGIN', async () => {
      await request(app())
        .get('/api/health')
        .set('Host', 'loja.exemplo.com')
        .set('Origin', 'https://loja.exemplo.com')
        .expect(200);
    });

    it('aceita origem listada e envia os cabeçalhos de CORS', async () => {
      const response = await request(app())
        .get('/api/health')
        .set('Origin', 'https://parceiro.exemplo.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://parceiro.exemplo.com',
      );
    });

    it('requisição sem Origin (monitoramento) passa', async () => {
      await request(app()).get('/api/health').expect(200);
    });
  });

  it('serve a documentação OpenAPI', async () => {
    const response = await request(ctx.app).get('/api/docs.json').expect(200);
    expect(response.body.openapi).toBe('3.1.0');
    await request(ctx.app).get('/api/docs/').expect(200);
  });

  it('em produção a documentação não é servida', async () => {
    const app = createApp(ctx.container, { docs: false });

    await request(app).get('/api/docs.json').expect(404);
    await request(app).get('/api/docs/').expect(404);
  });

  it('envia headers de segurança', async () => {
    const response = await request(ctx.app).get('/api/docs.json').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
