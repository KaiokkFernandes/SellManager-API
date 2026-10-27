import { IMAGE_UPLOAD } from '@sellmanager/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  TestContext,
} from './helpers';
import { AppDataSource } from '@shared/infra/typeorm/data-source';

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

    it('nome duplicado não diferencia maiúsculas, mas renomear o próprio produto pode', async () => {
      const created = await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send(keyboard)
        .expect(201);
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ ...keyboard, name: 'TECLADO' })
        .expect(409);
      await request(ctx.app)
        .put(`/products/${created.body.id as string}`)
        .set('Authorization', auth)
        .send({ ...keyboard, name: 'TECLADO' })
        .expect(200);
    });

    it('o banco também barra duplicados por maiúsculas (índice em lower(name))', async () => {
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send(keyboard)
        .expect(201);
      await expect(
        AppDataSource.query(
          "INSERT INTO products (name, price, quantity) VALUES ('teclado', 1, 1)",
        ),
      ).rejects.toMatchObject({ driverError: { code: '23505' } });
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
    it('busca por nome (parcial, sem maiúsculas, curingas escapados) e ordena', async () => {
      const items = [
        { name: 'Cabo USB', price_cents: 1500, quantity: 3 },
        { name: 'Mouse sem fio', price_cents: 9900, quantity: 1 },
        { name: 'cabo HDMI', price_cents: 3000, quantity: 8 },
        { name: 'Desconto 100%', price_cents: 100, quantity: 1 },
      ];
      for (const item of items) {
        await request(ctx.app)
          .post('/products')
          .set('Authorization', auth)
          .send(item)
          .expect(201);
      }
      const names = (body: { data: { name: string }[] }) =>
        body.data.map(product => product.name);

      const found = await request(ctx.app).get('/products?q=CABO').expect(200);
      expect(names(found.body)).toEqual(['Cabo USB', 'cabo HDMI'].sort());
      expect(found.body.meta.total).toBe(2);

      const byPrice = await request(ctx.app)
        .get('/products?q=cabo&sort=price&order=desc')
        .expect(200);
      expect(names(byPrice.body)).toEqual(['cabo HDMI', 'Cabo USB']);

      // % digitado pelo usuário é literal, não curinga
      const literal = await request(ctx.app).get('/products?q=%25').expect(200);
      expect(names(literal.body)).toEqual(['Desconto 100%']);

      // q vazio = sem filtro
      const all = await request(ctx.app)
        .get('/products?q=&sort=quantity&order=desc')
        .expect(200);
      expect(all.body.meta.total).toBe(4);
      expect(names(all.body)[0]).toBe('cabo HDMI');

      const invalid = await request(ctx.app)
        .get('/products?sort=senha')
        .expect(400);
      expect(invalid.body.issues[0]).toMatchObject({
        segment: 'query',
        path: 'sort',
      });
    });
  });

  describe('/products/{id}/image', () => {
    const png = { filename: 'foto.png', contentType: 'image/png' };

    async function createProduct() {
      const created = await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name: 'Teclado', price_cents: 100, quantity: 1 })
        .expect(201);
      expect(created.body.image_url).toBeNull();
      return created.body.id as string;
    }

    it('envia, substitui e remove a imagem; o arquivo é servido em /files', async () => {
      const id = await createProduct();

      const first = await request(ctx.app)
        .patch(`/products/${id}/image`)
        .set('Authorization', auth)
        .attach('image', Buffer.from('png-1'), png)
        .expect(200);
      const firstUrl = first.body.image_url as string;
      expect(firstUrl).toMatch(/\/files\/[a-f0-9]{32}\.png$/);
      const firstPath = new URL(firstUrl).pathname;
      await request(ctx.app).get(firstPath).expect(200);

      const second = await request(ctx.app)
        .patch(`/products/${id}/image`)
        .set('Authorization', auth)
        .attach('image', Buffer.from('webp-2'), {
          filename: 'foto.webp',
          contentType: 'image/webp',
        })
        .expect(200);
      expect(second.body.image_url).not.toBe(firstUrl);
      // a imagem anterior foi apagada
      await request(ctx.app).get(firstPath).expect(404);

      const shown = await request(ctx.app).get(`/products/${id}`).expect(200);
      expect(shown.body.image_url).toBe(second.body.image_url);

      const removed = await request(ctx.app)
        .delete(`/products/${id}/image`)
        .set('Authorization', auth)
        .expect(200);
      expect(removed.body.image_url).toBeNull();
    });

    it('rejeita tipo inválido, arquivo grande demais e envio sem arquivo', async () => {
      const id = await createProduct();

      const wrongType = await request(ctx.app)
        .patch(`/products/${id}/image`)
        .set('Authorization', auth)
        .attach('image', Buffer.from('%PDF'), {
          filename: 'doc.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
      expect(wrongType.body.code).toBe('INVALID_UPLOAD');

      const tooLarge = await request(ctx.app)
        .patch(`/products/${id}/image`)
        .set('Authorization', auth)
        .attach('image', Buffer.alloc(IMAGE_UPLOAD.maxBytes + 1), png)
        .expect(400);
      expect(tooLarge.body).toMatchObject({
        code: 'INVALID_UPLOAD',
        details: { reason: 'LIMIT_FILE_SIZE' },
      });

      await request(ctx.app)
        .patch(`/products/${id}/image`)
        .set('Authorization', auth)
        .expect(400);
    });

    it('exige autenticação e responde 404 para produto inexistente', async () => {
      const missing = '00000000-0000-4000-8000-000000000000';
      await request(ctx.app)
        .patch(`/products/${missing}/image`)
        .attach('image', Buffer.from('x'), png)
        .expect(401);
      await request(ctx.app)
        .patch(`/products/${missing}/image`)
        .set('Authorization', auth)
        .attach('image', Buffer.from('x'), png)
        .expect(404);
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

    it('busca por nome ou e-mail e ordena por e-mail', async () => {
      for (const customer of [
        { name: 'Ana Souza', email: 'ana@empresa.com' },
        { name: 'Bruno Lima', email: 'bruno@souza.dev' },
        { name: 'Carla Dias', email: 'carla@test.com' },
      ]) {
        await request(ctx.app)
          .post('/customers')
          .set('Authorization', auth)
          .send(customer)
          .expect(201);
      }

      const found = await request(ctx.app)
        .get('/customers?q=souza&sort=email&order=desc')
        .set('Authorization', auth)
        .expect(200);

      expect(
        found.body.data.map((customer: { email: string }) => customer.email),
      ).toEqual(['bruno@souza.dev', 'ana@empresa.com']);
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
