import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  TestContext,
} from './helpers';

interface Product {
  id: string;
  quantity: number;
}

describe('/orders', () => {
  let ctx: TestContext;
  let auth: string;
  let customerId: string;

  const createProduct = async (name: string, price: number, quantity: number) =>
    (
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name, price, quantity })
        .expect(201)
    ).body as Product;

  const stockOf = async (product: Product) =>
    (
      (await request(ctx.app).get(`/products/${product.id}`).expect(200))
        .body as Product
    ).quantity;

  const order = (products: { id: string; quantity: number }[]) =>
    request(ctx.app)
      .post('/orders')
      .set('Authorization', auth)
      .send({ customer_id: customerId, products });

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    auth = await authenticate(ctx.app);
    customerId = (
      await request(ctx.app)
        .post('/customers')
        .set('Authorization', auth)
        .send({ name: 'Ana', email: 'ana@test.com' })
        .expect(201)
    ).body.id as string;
  });
  afterAll(closeDatabase);

  it('cria o pedido com o preço do produto, total correto e baixa de estoque', async () => {
    const cable = await createProduct('Cabo', 0.1, 50);
    const mouse = await createProduct('Mouse', 0.2, 5);

    const response = await order([
      { id: cable.id, quantity: 3 },
      { id: mouse.id, quantity: 1 },
    ]).expect(201);

    expect(response.body).toMatchObject({
      status: 'pending',
      total: 0.5,
      customer_id: customerId,
    });
    expect(await stockOf(cable)).toBe(47);
    expect(await stockOf(mouse)).toBe(4);

    const shown = await request(ctx.app)
      .get(`/orders/${response.body.id as string}`)
      .set('Authorization', auth)
      .expect(200);
    expect(shown.body.items).toHaveLength(2);
  });

  it('estoque insuficiente responde 409 e não altera nada', async () => {
    const cable = await createProduct('Cabo', 1, 10);
    const mouse = await createProduct('Mouse', 1, 1);

    const response = await order([
      { id: cable.id, quantity: 1 },
      { id: mouse.id, quantity: 2 },
    ]).expect(409);

    expect(response.body).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      details: [{ product_id: mouse.id, available: 1, requested: 2 }],
    });
    expect(await stockOf(cable)).toBe(10);
    expect(await stockOf(mouse)).toBe(1);
    const list = await request(ctx.app)
      .get('/orders')
      .set('Authorization', auth)
      .expect(200);
    expect(list.body.meta.total).toBe(0);
  });

  it('pedidos concorrentes não vendem mais do que o estoque', async () => {
    const monitor = await createProduct('Monitor', 899.99, 3);

    const responses = await Promise.all(
      Array.from({ length: 8 }, () => order([{ id: monitor.id, quantity: 1 }])),
    );

    const statuses = responses.map(response => response.status).sort();
    expect(statuses.filter(status => status === 201)).toHaveLength(3);
    expect(statuses.filter(status => status === 409)).toHaveLength(5);
    expect(await stockOf(monitor)).toBe(0);
  });

  it('cancelar devolve o estoque e pedidos finalizados não mudam mais', async () => {
    const cable = await createProduct('Cabo', 1, 10);
    const created = await order([{ id: cable.id, quantity: 4 }]).expect(201);
    const statusUrl = `/orders/${created.body.id as string}/status`;

    await request(ctx.app)
      .patch(statusUrl)
      .set('Authorization', auth)
      .send({ status: 'canceled' })
      .expect(200);
    expect(await stockOf(cable)).toBe(10);

    await request(ctx.app)
      .patch(statusUrl)
      .set('Authorization', auth)
      .send({ status: 'completed' })
      .expect(409);
    await request(ctx.app)
      .patch(statusUrl)
      .set('Authorization', auth)
      .send({ status: 'pending' })
      .expect(400);
  });

  it('valida cliente e produtos inexistentes', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';

    await request(ctx.app)
      .post('/orders')
      .set('Authorization', auth)
      .send({ customer_id: missing, products: [{ id: missing, quantity: 1 }] })
      .expect(404);

    const response = await order([{ id: missing, quantity: 1 }]).expect(404);
    expect(response.body).toMatchObject({
      code: 'NOT_FOUND',
      details: { product_ids: [missing] },
    });
  });

  it('não permite apagar produto ou cliente que tem pedidos', async () => {
    const cable = await createProduct('Cabo', 1, 10);
    await order([{ id: cable.id, quantity: 1 }]).expect(201);

    const response = await request(ctx.app)
      .delete(`/products/${cable.id}`)
      .set('Authorization', auth)
      .expect(409);
    expect(response.body.code).toBe('RESOURCE_IN_USE');
    await request(ctx.app)
      .delete(`/customers/${customerId}`)
      .set('Authorization', auth)
      .expect(409);
  });

  it('filtra a listagem por cliente', async () => {
    const cable = await createProduct('Cabo', 1, 10);
    await order([{ id: cable.id, quantity: 1 }]).expect(201);

    const other = '00000000-0000-4000-8000-000000000000';
    const filtered = await request(ctx.app)
      .get(`/orders?customer_id=${other}`)
      .set('Authorization', auth)
      .expect(200);
    const all = await request(ctx.app)
      .get(`/orders?customer_id=${customerId}`)
      .set('Authorization', auth)
      .expect(200);

    expect(filtered.body.meta.total).toBe(0);
    expect(all.body.meta.total).toBe(1);
  });
});
