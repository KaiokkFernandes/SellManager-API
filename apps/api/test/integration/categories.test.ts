import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  TestContext,
} from './helpers';

describe('/categories', () => {
  let ctx: TestContext;
  let auth: string;

  const createCategory = async (name: string) =>
    (
      await request(ctx.app)
        .post('/categories')
        .set('Authorization', auth)
        .send({ name })
        .expect(201)
    ).body as { id: string; name: string; products_count: number };

  const createProduct = (name: string, category_id: string | null) =>
    request(ctx.app)
      .post('/products')
      .set('Authorization', auth)
      .send({ name, price_cents: 1000, quantity: 1, category_id });

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    auth = await authenticate(ctx);
  });
  afterAll(closeDatabase);

  it('CRUD com nome único (sem diferenciar maiúsculas) e contagem de produtos', async () => {
    const cables = await createCategory('Cabos');
    expect(cables).toMatchObject({ name: 'Cabos', products_count: 0 });

    const duplicated = await request(ctx.app)
      .post('/categories')
      .set('Authorization', auth)
      .send({ name: 'CABOS' })
      .expect(409);
    expect(duplicated.body).toMatchObject({
      code: 'ALREADY_EXISTS',
      issues: [{ path: 'name' }],
    });

    await createProduct('Cabo USB', cables.id).expect(201);
    const renamed = await request(ctx.app)
      .put(`/categories/${cables.id}`)
      .set('Authorization', auth)
      .send({ name: 'Cabos e adaptadores' })
      .expect(200);
    expect(renamed.body).toMatchObject({
      name: 'Cabos e adaptadores',
      products_count: 1,
    });

    const list = await request(ctx.app)
      .get('/categories?q=adapt')
      .set('Authorization', auth)
      .expect(200);
    expect(list.body.data).toEqual([
      expect.objectContaining({ id: cables.id, products_count: 1 }),
    ]);
  });

  it('produto mostra a categoria e a listagem filtra por ela', async () => {
    const cables = await createCategory('Cabos');
    const created = await createProduct('Cabo USB', cables.id).expect(201);
    expect(created.body.category).toEqual({ id: cables.id, name: 'Cabos' });
    await createProduct('Mouse', null).expect(201);

    const filtered = await request(ctx.app)
      .get(`/products?category_id=${cables.id}`)
      .set('Authorization', auth)
      .expect(200);
    expect(
      filtered.body.data.map((product: { name: string }) => product.name),
    ).toEqual(['Cabo USB']);

    // tirar a categoria do produto
    const updated = await request(ctx.app)
      .put(`/products/${created.body.id as string}`)
      .set('Authorization', auth)
      .send({ name: 'Cabo USB', price_cents: 1000, category_id: null })
      .expect(200);
    expect(updated.body.category).toBeNull();
  });

  it('categoria inexistente no produto: 404', async () => {
    const response = await createProduct(
      'Cabo',
      '00000000-0000-4000-8000-000000000000',
    ).expect(404);
    expect(response.body.message).toBe('Category not found');
  });

  it('não exclui categoria com produtos; sem produtos, exclui', async () => {
    const cables = await createCategory('Cabos');
    const product = await createProduct('Cabo USB', cables.id).expect(201);

    const blocked = await request(ctx.app)
      .delete(`/categories/${cables.id}`)
      .set('Authorization', auth)
      .expect(409);
    expect(blocked.body).toMatchObject({
      code: 'RESOURCE_IN_USE',
      details: { products_count: 1 },
    });

    await request(ctx.app)
      .delete(`/products/${product.body.id as string}`)
      .set('Authorization', auth)
      .expect(204);
    await request(ctx.app)
      .delete(`/categories/${cables.id}`)
      .set('Authorization', auth)
      .expect(204);
  });

  it('SELLER lê categorias, mas não as altera', async () => {
    const seller = await authenticate(ctx, {
      email: 'vendedor@test.com',
      role: 'SELLER',
    });
    await request(ctx.app)
      .get('/categories')
      .set('Authorization', seller)
      .expect(200);
    await request(ctx.app)
      .post('/categories')
      .set('Authorization', seller)
      .send({ name: 'Cabos' })
      .expect(403);
  });
});
