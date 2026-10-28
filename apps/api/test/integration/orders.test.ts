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

interface Product {
  id: string;
  quantity: number;
}

describe('/orders', () => {
  let ctx: TestContext;
  let auth: string;
  let customerId: string;

  const createProduct = async (
    name: string,
    price_cents: number,
    quantity: number,
  ) =>
    (
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name, price_cents, quantity })
        .expect(201)
    ).body as Product;

  const stockOf = async (product: Product) =>
    (
      (
        await request(ctx.app)
          .get(`/products/${product.id}`)
          .set('Authorization', auth)
          .expect(200)
      ).body as Product
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
    auth = await authenticate(ctx);
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
    const cable = await createProduct('Cabo', 10, 50);
    const mouse = await createProduct('Mouse', 20, 5);

    const response = await order([
      { id: cable.id, quantity: 3 },
      { id: mouse.id, quantity: 1 },
    ]).expect(201);

    expect(response.body).toMatchObject({
      status: 'pending',
      total_cents: 50,
      customer_id: customerId,
      customer: { id: customerId, name: 'Ana', email: 'ana@test.com' },
    });
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          product: { id: cable.id, name: 'Cabo' },
          price_cents: 10,
          quantity: 3,
        }),
      ]),
    );
    expect(await stockOf(cable)).toBe(47);
    expect(await stockOf(mouse)).toBe(4);

    const shown = await request(ctx.app)
      .get(`/orders/${response.body.id as string}`)
      .set('Authorization', auth)
      .expect(200);
    expect(shown.body.items).toHaveLength(2);
  });

  it('estoque insuficiente responde 409 e não altera nada', async () => {
    const cable = await createProduct('Cabo', 100, 10);
    const mouse = await createProduct('Mouse', 100, 1);

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
    const monitor = await createProduct('Monitor', 89999, 3);

    const responses = await Promise.all(
      Array.from({ length: 8 }, () => order([{ id: monitor.id, quantity: 1 }])),
    );

    const statuses = responses.map(response => response.status).sort();
    expect(statuses.filter(status => status === 201)).toHaveLength(3);
    expect(statuses.filter(status => status === 409)).toHaveLength(5);
    expect(await stockOf(monitor)).toBe(0);
  });

  it('cancelar devolve o estoque e pedidos finalizados não mudam mais', async () => {
    const cable = await createProduct('Cabo', 100, 10);
    const created = await order([{ id: cable.id, quantity: 4 }]).expect(201);
    const orderUrl = `/orders/${created.body.id as string}`;

    await request(ctx.app)
      .patch(`${orderUrl}/cancel`)
      .set('Authorization', auth)
      .expect(200);
    expect(await stockOf(cable)).toBe(10);

    await request(ctx.app)
      .patch(`${orderUrl}/complete`)
      .set('Authorization', auth)
      .expect(409);
    await request(ctx.app)
      .patch(`${orderUrl}/cancel`)
      .set('Authorization', auth)
      .expect(409);
  });

  it('concluir não mexe no estoque', async () => {
    const cable = await createProduct('Cabo', 100, 10);
    const created = await order([{ id: cable.id, quantity: 4 }]).expect(201);

    const completed = await request(ctx.app)
      .patch(`/orders/${created.body.id as string}/complete`)
      .set('Authorization', auth)
      .expect(200);
    expect(completed.body.status).toBe('completed');
    expect(await stockOf(cable)).toBe(6);
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
    const cable = await createProduct('Cabo', 100, 10);
    await order([{ id: cable.id, quantity: 1 }]).expect(201);

    const response = await request(ctx.app)
      .delete(`/products/${cable.id}`)
      .set('Authorization', auth)
      .expect(409);
    expect(response.body).toMatchObject({
      code: 'RESOURCE_IN_USE',
      message: 'Product is in orders and cannot be deleted',
      details: { orders_count: 1 },
    });
    const customer = await request(ctx.app)
      .delete(`/customers/${customerId}`)
      .set('Authorization', auth)
      .expect(409);
    expect(customer.body).toMatchObject({
      code: 'RESOURCE_IN_USE',
      message: 'Customer has orders and cannot be deleted',
      details: { orders_count: 1 },
    });
  });

  it('filtra a listagem por cliente', async () => {
    const cable = await createProduct('Cabo', 100, 10);
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

  it('o item guarda o preço da compra mesmo se o produto mudar de preço', async () => {
    const cable = await createProduct('Cabo', 1000, 10);
    const created = await order([{ id: cable.id, quantity: 2 }]).expect(201);

    await request(ctx.app)
      .put(`/products/${cable.id}`)
      .set('Authorization', auth)
      .send({ name: 'Cabo trançado', price_cents: 5000, quantity: 8 })
      .expect(200);

    const shown = await request(ctx.app)
      .get(`/orders/${created.body.id as string}`)
      .set('Authorization', auth)
      .expect(200);
    expect(shown.body.total_cents).toBe(2000);
    expect(shown.body.items[0]).toMatchObject({
      price_cents: 1000,
      product: { name: 'Cabo trançado' },
    });
  });

  it('filtra por período [from, to) e valida o intervalo', async () => {
    const cable = await createProduct('Cabo', 100, 10);
    const ids: string[] = [];
    for (const day of [
      '2026-09-30T23:30:00Z',
      '2026-10-01T12:00:00Z',
      '2026-10-31T23:59:59Z',
    ]) {
      const created = await order([{ id: cable.id, quantity: 1 }]).expect(201);
      ids.push(created.body.id as string);
      await AppDataSource.query(
        'UPDATE orders SET created_at = $1 WHERE id = $2',
        [day, created.body.id],
      );
    }

    const october = await request(ctx.app)
      .get('/orders')
      .query({ from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' })
      .set('Authorization', auth)
      .expect(200);
    expect(october.body.data.map((item: { id: string }) => item.id)).toEqual([
      ids[2],
      ids[1],
    ]);

    // o offset do fuso é respeitado: 30/09 23:30Z é 30/09 20:30 em -03:00
    const fromLocal = await request(ctx.app)
      .get('/orders')
      .query({ from: '2026-09-30T20:00:00-03:00' })
      .set('Authorization', auth)
      .expect(200);
    expect(fromLocal.body.meta.total).toBe(3);

    const inverted = await request(ctx.app)
      .get('/orders')
      .query({ from: '2026-11-01T00:00:00Z', to: '2026-10-01T00:00:00Z' })
      .set('Authorization', auth)
      .expect(400);
    expect(inverted.body.issues[0]).toMatchObject({
      segment: 'query',
      path: 'to',
    });
  });
});
