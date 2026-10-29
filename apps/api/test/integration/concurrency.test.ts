import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  stockInconsistencies,
  TestContext,
} from './helpers';

/**
 * Requisições disparadas ao mesmo tempo contra o Postgres real: o lock nas
 * linhas (pedido e produtos) serializa quem disputa o mesmo recurso.
 */
describe('concorrência em pedidos e estoque', () => {
  let ctx: TestContext;
  let auth: string;
  let customerId: string;

  const createProduct = async (quantity: number) =>
    (
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name: `Produto ${quantity}`, price_cents: 1000, quantity })
        .expect(201)
    ).body.id as string;

  const order = (productId: string, quantity = 1) =>
    request(ctx.app)
      .post('/orders')
      .set('Authorization', auth)
      .send({
        customer_id: customerId,
        products: [{ id: productId, quantity }],
      });

  const act = (orderId: string, action: string, body: object = {}) =>
    request(ctx.app)
      .patch(`/orders/${orderId}/${action}`)
      .set('Authorization', auth)
      .send(body);

  const stockOf = async (productId: string) =>
    (
      await request(ctx.app)
        .get(`/products/${productId}`)
        .set('Authorization', auth)
        .expect(200)
    ).body.quantity as number;

  const countMovements = async (productId: string, type: string) => {
    const [{ count }] = await AppDataSource.query<[{ count: number }]>(
      'SELECT count(*)::int AS count FROM stock_movements WHERE product_id = $1 AND type = $2',
      [productId, type],
    );
    return count;
  };

  const tally = (statuses: number[]) =>
    statuses.reduce<Record<number, number>>(
      (acc, status) => ({ ...acc, [status]: (acc[status] ?? 0) + 1 }),
      {},
    );

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
  afterEach(async () => {
    expect(await stockInconsistencies()).toEqual([]);
  });
  afterAll(closeDatabase);

  it('10 pedidos disputando o último item: exatamente um vende', async () => {
    const productId = await createProduct(1);

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => order(productId)),
    );

    expect(tally(responses.map(response => response.status))).toEqual({
      201: 1,
      409: 9,
    });
    for (const response of responses.filter(r => r.status === 409)) {
      expect(response.body).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        details: [{ product_id: productId, available: 0, requested: 1 }],
      });
    }
    expect(await stockOf(productId)).toBe(0);
    expect(await countMovements(productId, 'SALE')).toBe(1);
  });

  it('cancelamento duplo simultâneo devolve o estoque uma vez só', async () => {
    const productId = await createProduct(5);
    const created = await order(productId, 3).expect(201);
    const id = created.body.id as string;

    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        act(id, 'cancel', { reason: 'Cliente desistiu' }),
      ),
    );

    expect(tally(responses.map(response => response.status))).toEqual({
      200: 1,
      409: 3,
    });
    expect(await stockOf(productId)).toBe(5);
    expect(await countMovements(productId, 'CANCEL_RETURN')).toBe(1);
  });

  it('cancelar e enviar ao mesmo tempo: só uma transição vence', async () => {
    const productId = await createProduct(5);
    const created = await order(productId, 2).expect(201);
    const id = created.body.id as string;
    await act(id, 'pay').expect(200);

    const [cancel, ship] = await Promise.all([
      act(id, 'cancel', { reason: 'Cliente desistiu' }),
      act(id, 'ship'),
    ]);

    expect([cancel.status, ship.status].sort()).toEqual([200, 409]);
    const shown = await request(ctx.app)
      .get(`/orders/${id}`)
      .set('Authorization', auth)
      .expect(200);
    // o estoque só voltou se o cancelamento venceu
    expect(await stockOf(productId)).toBe(cancel.status === 200 ? 5 : 3);
    expect(shown.body.status).toBe(
      cancel.status === 200 ? 'canceled' : 'shipped',
    );
    expect(shown.body.history).toHaveLength(3);
  });

  it('vendas e ajuste manual simultâneos nunca deixam o saldo negativo', async () => {
    const productId = await createProduct(5);

    const [adjustment, ...orders] = await Promise.all([
      request(ctx.app)
        .post(`/products/${productId}/stock-movements`)
        .set('Authorization', auth)
        .send({ type: 'ADJUSTMENT', quantity: -3, reason: 'Avaria' }),
      ...Array.from({ length: 5 }, () => order(productId)),
    ]);

    const sold = orders.filter(response => response.status === 201).length;
    const removed = adjustment.status === 201 ? 3 : 0;
    expect([201, 409]).toContain(adjustment.status);
    expect(sold + removed).toBeLessThanOrEqual(5);
    expect(await stockOf(productId)).toBe(5 - sold - removed);
    expect(await countMovements(productId, 'SALE')).toBe(sold);
  });
});
