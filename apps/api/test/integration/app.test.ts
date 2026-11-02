import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  it('serve a documentação OpenAPI', async () => {
    const response = await request(ctx.app).get('/docs.json').expect(200);
    expect(response.body.openapi).toBe('3.1.0');
    await request(ctx.app).get('/docs/').expect(200);
  });

  it('envia headers de segurança', async () => {
    const response = await request(ctx.app).get('/docs.json').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
