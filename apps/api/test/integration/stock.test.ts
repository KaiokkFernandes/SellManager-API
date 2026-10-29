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
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  stockInconsistencies,
  TestContext,
} from './helpers';

interface Movement {
  type: string;
  quantity: number;
  balance_after: number;
  reason: string | null;
  order_id: string | null;
  created_by: { name: string } | null;
}

describe('estoque (movimentações)', () => {
  let ctx: TestContext;
  let auth: string;
  let productId: string;

  const movements = async () =>
    (
      await request(ctx.app)
        .get(`/products/${productId}/stock-movements`)
        .set('Authorization', auth)
        .expect(200)
    ).body as { data: Movement[]; meta: { total: number } };

  const move = (body: object, as = auth) =>
    request(ctx.app)
      .post(`/products/${productId}/stock-movements`)
      .set('Authorization', as)
      .send(body);

  const stock = async () =>
    (
      await request(ctx.app)
        .get(`/products/${productId}`)
        .set('Authorization', auth)
        .expect(200)
    ).body.quantity as number;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    auth = await authenticate(ctx);
    productId = (
      await request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name: 'Cabo', price_cents: 1000, quantity: 10 })
        .expect(201)
    ).body.id as string;
  });
  afterEach(async () => {
    expect(await stockInconsistencies()).toEqual([]);
  });
  afterAll(closeDatabase);

  it('o cadastro registra o saldo inicial', async () => {
    const { data } = await movements();
    expect(data).toEqual([
      expect.objectContaining({
        type: 'INITIAL',
        quantity: 10,
        balance_after: 10,
        created_by: expect.objectContaining({ name: 'Kaio' }),
      }),
    ]);
  });

  it('entrada e ajuste manual mudam o saldo; editar o produto não', async () => {
    const entry = await move({ type: 'ENTRY', quantity: 5 }).expect(201);
    expect(entry.body).toMatchObject({ type: 'ENTRY', balance_after: 15 });
    const adjustment = await move({
      type: 'ADJUSTMENT',
      quantity: -3,
      reason: 'Avaria',
    }).expect(201);
    expect(adjustment.body).toMatchObject({
      balance_after: 12,
      reason: 'Avaria',
    });

    // quantity no PUT é ignorado: o estoque só muda por movimentação
    await request(ctx.app)
      .put(`/products/${productId}`)
      .set('Authorization', auth)
      .send({ name: 'Cabo', price_cents: 1200, quantity: 999 })
      .expect(200);
    expect(await stock()).toBe(12);

    const { data, meta } = await movements();
    expect(meta.total).toBe(3);
    expect(data.map(movement => movement.type)).toEqual([
      'ADJUSTMENT',
      'ENTRY',
      'INITIAL',
    ]);
  });

  it('valida a movimentação (motivo, sinal, zero) no schema do shared', async () => {
    const noReason = await move({ type: 'ADJUSTMENT', quantity: -1 }).expect(
      400,
    );
    expect(noReason.body.issues).toEqual([
      expect.objectContaining({
        path: 'reason',
        message: 'A reason is required',
      }),
    ]);
    const negativeEntry = await move({ type: 'ENTRY', quantity: -1 }).expect(
      400,
    );
    expect(negativeEntry.body.issues[0]).toMatchObject({
      path: 'quantity',
      message: 'An entry must have a positive quantity',
    });
    await move({ type: 'ADJUSTMENT', quantity: 0, reason: 'x' }).expect(400);
    // SALE e CANCEL_RETURN só nascem de pedidos
    await move({ type: 'SALE', quantity: -1 }).expect(400);
    expect(await stock()).toBe(10);
  });

  it('ajuste que deixaria o saldo negativo: 409 INSUFFICIENT_STOCK', async () => {
    const response = await move({
      type: 'ADJUSTMENT',
      quantity: -11,
      reason: 'Inventário',
    }).expect(409);
    expect(response.body).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      details: [{ product_id: productId, available: 10, requested: 11 }],
    });
    expect(await stock()).toBe(10);
  });

  it('SELLER não vê nem registra movimentações; MANAGER sim', async () => {
    const seller = await authenticate(ctx, {
      email: 'vendedor@test.com',
      role: 'SELLER',
    });
    const manager = await authenticate(ctx, {
      email: 'gerente@test.com',
      role: 'MANAGER',
    });

    await request(ctx.app)
      .get(`/products/${productId}/stock-movements`)
      .set('Authorization', seller)
      .expect(403);
    await move({ type: 'ENTRY', quantity: 1 }, seller).expect(403);
    await move({ type: 'ENTRY', quantity: 1 }, manager).expect(201);
  });

  it('404 para produto inexistente', async () => {
    productId = '00000000-0000-4000-8000-000000000000';
    await request(ctx.app)
      .get(`/products/${productId}/stock-movements`)
      .set('Authorization', auth)
      .expect(404);
    await move({ type: 'ENTRY', quantity: 1 }).expect(404);
  });

  it('estoque mínimo: alerta no produto e lista de estoque baixo', async () => {
    const create = (name: string, quantity: number, min_stock: number) =>
      request(ctx.app)
        .post('/products')
        .set('Authorization', auth)
        .send({ name, price_cents: 100, quantity, min_stock })
        .expect(201);

    const hub = await create('Hub', 1, 5);
    expect(hub.body).toMatchObject({ min_stock: 5, below_min_stock: true });
    await create('Mouse', 2, 3);
    await create('Teclado', 9, 3);

    const seller = await authenticate(ctx, {
      email: 'vendedor@test.com',
      role: 'SELLER',
    });
    const low = await request(ctx.app)
      .get('/products/low-stock')
      .set('Authorization', seller)
      .expect(200);
    expect(low.body.meta.total).toBe(2);
    expect(
      low.body.data.map((product: { name: string }) => product.name),
    ).toEqual(['Hub', 'Mouse']);

    // a entrada tira o produto da lista
    await request(ctx.app)
      .post(`/products/${hub.body.id as string}/stock-movements`)
      .set('Authorization', auth)
      .send({ type: 'ENTRY', quantity: 10 })
      .expect(201);
    const after = await request(ctx.app)
      .get('/products/low-stock')
      .set('Authorization', auth)
      .expect(200);
    expect(after.body.meta.total).toBe(1);

    // editar o mínimo: zero desliga o alerta
    const edited = await request(ctx.app)
      .put(`/products/${productId}`)
      .set('Authorization', auth)
      .send({ name: 'Cabo', price_cents: 1000, min_stock: 20 })
      .expect(200);
    expect(edited.body.below_min_stock).toBe(true);
  });
});
