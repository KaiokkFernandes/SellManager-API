import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  TestContext,
} from './helpers';

describe('Produtos e clientes', () => {
  let ctx: TestContext;
  let auth: string;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    auth = await authenticate(ctx.app);
  });
  afterAll(closeDatabase);

  describe('/products', () => {
    const keyboard = { name: 'Teclado', price_cents: 19990, quantity: 10 };

    it('leitura é pública, escrita exige autenticação', async () => {
      await request(ctx.app).get('/products').expect(200);
      await request(ctx.app).post('/products').send(keyboard).expect(401);
    });

    it('CRUD completo com preço numérico', async () => {
      const created = await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send(keyboard)
        .expect(201);
      const id = created.body.id as string;

      const shown = await request(ctx.app).get(`/products/${id}`).expect(200);
      expect(shown.body.price_cents).toBe(19990);

      await request(ctx.app)
        .put(`/products/${id}`)
        .set('Authorization', auth)
        .send({ ...keyboard, price_cents: 15000 })
        .expect(200);

      await request(ctx.app)
        .delete(`/products/${id}`)
        .set('Authorization', auth)
        .expect(204);
      await request(ctx.app).get(`/products/${id}`).expect(404);
    });

    it('valida o body e rejeita nome duplicado', async () => {
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name: 'X', price_cents: 1.5, quantity: -1 })
        .expect(400);

      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send(keyboard)
        .expect(201);
      const duplicate = await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send(keyboard)
        .expect(409);
      expect(duplicate.body).toMatchObject({
        code: 'ALREADY_EXISTS',
        issues: [{ segment: 'body', path: 'name' }],
      });
    });

    it('cadastros simultâneos do mesmo nome: um 201, o resto 409 (nunca 500)', async () => {
      const responses = await Promise.all(
        Array.from({ length: 6 }, () =>
          request(ctx.app)
            .post('/products')
            .set('Authorization', auth)
            .send(keyboard),
        ),
      );

      const statuses = responses.map(response => response.status).sort();
      expect(statuses).toEqual([201, 409, 409, 409, 409, 409]);
      for (const response of responses.filter(r => r.status === 409)) {
        expect(response.body).toMatchObject({
          code: 'ALREADY_EXISTS',
          issues: [{ segment: 'body', path: 'name' }],
        });
      }
    });

    it('pagina a listagem', async () => {
      for (const name of ['A', 'B', 'C']) {
        await request(ctx.app)
          .post('/products')
          .set('Authorization', auth)
          .send({ ...keyboard, name })
          .expect(201);
      }

      const page = await request(ctx.app)
        .get('/products?page=2&limit=2')
        .expect(200);

      expect(
        page.body.data.map((product: { name: string }) => product.name),
      ).toEqual(['C']);
      expect(page.body.meta).toEqual({
        page: 2,
        limit: 2,
        total: 3,
        total_pages: 2,
      });
    });
  });

  describe('/customers', () => {
    it('exige autenticação', async () => {
      await request(ctx.app).get('/customers').expect(401);
    });

    it('CRUD completo, mantendo o próprio e-mail na atualização', async () => {
      const created = await request(ctx.app)
        .post('/customers')
        .set('Authorization', auth)
        .send({ name: 'Ana', email: 'ana@test.com' })
        .expect(201);
      const id = created.body.id as string;

      // regressão: antes a atualização com o mesmo e-mail falhava sempre
      const updated = await request(ctx.app)
        .put(`/customers/${id}`)
        .set('Authorization', auth)
        .send({ name: 'Ana Maria', email: 'ana@test.com' })
        .expect(200);
      expect(updated.body.name).toBe('Ana Maria');

      const list = await request(ctx.app)
        .get('/customers')
        .set('Authorization', auth)
        .expect(200);
      expect(list.body.meta.total).toBe(1);

      await request(ctx.app)
        .delete(`/customers/${id}`)
        .set('Authorization', auth)
        .expect(204);
      await request(ctx.app)
        .get(`/customers/${id}`)
        .set('Authorization', auth)
        .expect(404);
    });

    it('rejeita e-mail de outro cliente', async () => {
      await request(ctx.app)
        .post('/customers')
        .set('Authorization', auth)
        .send({ name: 'Ana', email: 'ana@test.com' })
        .expect(201);
      const response = await request(ctx.app)
        .post('/customers')
        .set('Authorization', auth)
        .send({ name: 'Bia', email: 'ANA@test.com ' })
        .expect(409);
      expect(response.body).toMatchObject({
        code: 'ALREADY_EXISTS',
        issues: [{ segment: 'body', path: 'email' }],
      });
    });
  });
});
