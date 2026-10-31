import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  TestContext,
} from './helpers';

/**
 * Métricas com dados controlados e valores exatos. Fuso: America/Sao_Paulo
 * (UTC−3, sem horário de verão em 2026). Período: outubro/2026 (personalizado);
 * anterior: 31/08 a 30/09.
 */
const OCTOBER = { preset: 'custom', from: '2026-10-01', to: '2026-10-31' };

describe('/metrics', () => {
  let ctx: TestContext;
  let admin: string;
  let seller: string;
  let customerId: string;
  let productId: string;

  /** Pedido de `units` × R$ 10,00 com as datas forçadas (status coerente). */
  const order = async (
    auth: string,
    units: number,
    dates: { paid?: string; canceled?: string; created?: string } = {},
  ) => {
    const created = await request(ctx.app)
      .post('/orders')
      .set('Authorization', auth)
      .send({
        customer_id: customerId,
        products: [{ id: productId, quantity: units }],
      })
      .expect(201);
    const id = created.body.id as string;
    const status = dates.canceled
      ? 'canceled'
      : dates.paid
        ? 'paid'
        : 'pending';
    await AppDataSource.query(
      `UPDATE orders SET status = $2, paid_at = $3, canceled_at = $4,
         created_at = COALESCE($5, $3, $4, created_at) WHERE id = $1`,
      [
        id,
        status,
        dates.paid ?? null,
        dates.canceled ?? null,
        dates.created ?? null,
      ],
    );
    return id;
  };

  const summary = (auth: string, query: object = OCTOBER) =>
    request(ctx.app)
      .get('/metrics/summary')
      .query(query)
      .set('Authorization', auth)
      .expect(200);

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    admin = await authenticate(ctx);
    seller = await authenticate(ctx, {
      email: 'vendedor@test.com',
      role: 'SELLER',
    });
    customerId = (
      await request(ctx.app)
        .post('/customers')
        .set('Authorization', admin)
        .send({ name: 'Ana', email: 'ana@test.com' })
        .expect(201)
    ).body.id as string;
    productId = (
      await request(ctx.app)
        .post('/products')
        .set('Authorization', admin)
        .send({ name: 'Cabo', price_cents: 1000, quantity: 1000 })
        .expect(201)
    ).body.id as string;
  });
  afterAll(closeDatabase);

  describe('summary', () => {
    beforeEach(async () => {
      // outubro: duas vendas, uma delas no último minuto local do mês
      await order(admin, 10, { paid: '2026-10-10T12:00:00Z' }); // R$ 100
      await order(admin, 5, { paid: '2026-11-01T02:30:00Z' }); // 31/10 23:30 em SP: R$ 50
      // pago e depois cancelado: sai do faturamento, entra nos cancelados de outubro
      await order(admin, 7, {
        paid: '2026-10-05T12:00:00Z',
        canceled: '2026-10-06T12:00:00Z',
      }); // R$ 70
      // pendente: não é venda
      await order(admin, 2, { created: '2026-10-15T12:00:00Z' });
      // setembro (anterior): 01/10 02:00 UTC ainda é 30/09 23:00 em SP
      await order(admin, 3, { paid: '2026-10-01T02:00:00Z' }); // R$ 30
      await order(admin, 4, { canceled: '2026-09-15T12:00:00Z' }); // R$ 40
    });

    it('valores exatos do período e do anterior, com a borda de fuso', async () => {
      const { body } = await summary(admin);

      expect(body.period).toEqual({
        preset: 'custom',
        timezone: 'America/Sao_Paulo',
        current: { from: '2026-10-01', to: '2026-10-31' },
        previous: { from: '2026-08-31', to: '2026-09-30' },
      });
      expect(body.scope).toBe('all');
      expect(body.current).toEqual({
        revenue_cents: 15000,
        orders: 2,
        average_ticket_cents: 7500,
        canceled_orders: 1,
        canceled_cents: 7000,
        cancel_rate: 0.3333,
      });
      expect(body.previous).toEqual({
        revenue_cents: 3000,
        orders: 1,
        average_ticket_cents: 3000,
        canceled_orders: 1,
        canceled_cents: 4000,
        cancel_rate: 0.5,
      });
      expect(body.change).toEqual({
        revenue: 4,
        orders: 1,
        average_ticket: 1.5,
        canceled_orders: 0,
        cancel_rate: -0.1667,
      });
    });

    it('período sem nada: zeros e variações nulas', async () => {
      const { body } = await summary(admin, {
        preset: 'custom',
        from: '2025-01-01',
        to: '2025-01-31',
      });
      expect(body.current).toMatchObject({ revenue_cents: 0, orders: 0 });
      expect(body.change).toMatchObject({ revenue: null, orders: null });
    });

    it('SELLER vê só os pedidos que criou (scope=own)', async () => {
      await order(seller, 1, { paid: '2026-10-20T12:00:00Z' }); // R$ 10

      const own = await summary(seller);
      expect(own.body.scope).toBe('own');
      expect(own.body.current).toMatchObject({
        revenue_cents: 1000,
        orders: 1,
      });
      const all = await summary(admin);
      expect(all.body.current).toMatchObject({
        revenue_cents: 16000,
        orders: 3,
      });
    });
  });

  describe('blocos do dashboard', () => {
    let cableId: string;
    let mouseId: string;
    let otherCustomer: string;

    // pedido com linhas livres (produto, unidades) e datas forçadas
    const sale = async (
      customer: string,
      lines: [string, number][],
      dates: { paid?: string; canceled?: string; created?: string },
    ) => {
      const created = await request(ctx.app)
        .post('/orders')
        .set('Authorization', admin)
        .send({
          customer_id: customer,
          products: lines.map(([id, quantity]) => ({ id, quantity })),
        })
        .expect(201);
      const id = created.body.id as string;
      const status = dates.canceled
        ? 'canceled'
        : dates.paid
          ? 'delivered'
          : 'pending';
      await AppDataSource.query(
        `UPDATE orders SET status = $2, paid_at = $3::timestamptz,
           canceled_at = $4::timestamptz,
           created_at = COALESCE($5::timestamptz, $3::timestamptz, $4::timestamptz)
         WHERE id = $1`,
        [
          id,
          status,
          dates.paid ?? null,
          dates.canceled ?? null,
          dates.created ?? null,
        ],
      );
    };

    beforeEach(async () => {
      const cables = (
        await request(ctx.app)
          .post('/categories')
          .set('Authorization', admin)
          .send({ name: 'Cabos' })
          .expect(201)
      ).body.id as string;
      const product = (
        name: string,
        price_cents: number,
        category_id: string | null,
      ) =>
        request(ctx.app)
          .post('/products')
          .set('Authorization', admin)
          .send({ name, price_cents, quantity: 100, category_id })
          .expect(201)
          .then(response => response.body.id as string);
      cableId = await product('Cabo HDMI', 2000, cables); // R$ 20
      mouseId = await product('Mouse', 5000, null); // R$ 50, sem categoria
      otherCustomer = (
        await request(ctx.app)
          .post('/customers')
          .set('Authorization', admin)
          .send({ name: 'Bruno', email: 'bruno@test.com' })
          .expect(201)
      ).body.id as string;

      // seg 05/10: Ana compra 2 cabos (R$ 40)
      await sale(customerId, [[cableId, 2]], { paid: '2026-10-05T15:00:00Z' });
      // qua 07/10: Bruno compra 1 mouse e 1 cabo (R$ 70)
      await sale(
        otherCustomer,
        [
          [mouseId, 1],
          [cableId, 1],
        ],
        {
          paid: '2026-10-07T15:00:00Z',
        },
      );
      // dom 11/10 23:30 em SP (seg 12/10 em UTC): Bruno, 2 mouses (R$ 100)
      await sale(otherCustomer, [[mouseId, 2]], {
        paid: '2026-10-12T02:30:00Z',
      });
      // cancelado: não entra em tops, série nem categorias
      await sale(customerId, [[mouseId, 10]], {
        paid: '2026-10-06T15:00:00Z',
        canceled: '2026-10-06T18:00:00Z',
      });
      // pendente criado em 08/10: só no funil de status
      await sale(customerId, [[cableId, 1]], {
        created: '2026-10-08T15:00:00Z',
      });
    });

    const WEEK = { preset: 'custom', from: '2026-10-05', to: '2026-10-11' };
    const get = (path: string, query: object = WEEK) =>
      request(ctx.app)
        .get(`/metrics/${path}`)
        .query(query)
        .set('Authorization', admin)
        .expect(200);

    it('série diária com os dias vazios em zero e a venda das 23:30 no domingo', async () => {
      const { body } = await get('revenue');
      expect(body.granularity).toBe('day');
      expect(
        body.points.map((p: { bucket: string; revenue_cents: number }) => [
          p.bucket,
          p.revenue_cents,
        ]),
      ).toEqual([
        ['2026-10-05', 4000],
        ['2026-10-06', 0],
        ['2026-10-07', 7000],
        ['2026-10-08', 0],
        ['2026-10-09', 0],
        ['2026-10-10', 0],
        ['2026-10-11', 10000],
      ]);
    });

    it('série semanal começa na segunda-feira', async () => {
      const { body } = await get('revenue', {
        preset: 'custom',
        from: '2026-10-01',
        to: '2026-10-31',
        granularity: 'week',
      });
      expect(
        body.points.map((p: { bucket: string; orders: number }) => [
          p.bucket,
          p.orders,
        ]),
      ).toEqual([
        ['2026-09-28', 0],
        ['2026-10-05', 3],
        ['2026-10-12', 0],
        ['2026-10-19', 0],
        ['2026-10-26', 0],
      ]);
    });

    it('top produtos e clientes pelo faturamento (cancelado fora)', async () => {
      const products = await get('top-products');
      expect(products.body.items).toEqual([
        {
          product: { id: mouseId, name: 'Mouse' },
          units: 3,
          revenue_cents: 15000,
        },
        {
          product: { id: cableId, name: 'Cabo HDMI' },
          units: 3,
          revenue_cents: 6000,
        },
      ]);
      const customers = await get('top-customers', { ...WEEK, limit: 1 });
      expect(customers.body.items).toEqual([
        {
          customer: {
            id: otherCustomer,
            name: 'Bruno',
            email: 'bruno@test.com',
          },
          orders: 2,
          revenue_cents: 17000,
        },
      ]);
    });

    it('vendas por categoria, com "sem categoria" como null', async () => {
      const { body } = await get('categories');
      expect(body.items).toEqual([
        { category: null, units: 3, revenue_cents: 15000 },
        {
          category: { id: expect.any(String), name: 'Cabos' },
          units: 3,
          revenue_cents: 6000,
        },
      ]);
    });

    it('pedidos por status: criados no período, todos os status em ordem', async () => {
      const { body } = await get('status');
      expect(
        body.items.map((item: { status: string; orders: number }) => [
          item.status,
          item.orders,
        ]),
      ).toEqual([
        ['pending', 1],
        ['paid', 0],
        ['shipped', 0],
        ['delivered', 3],
        ['canceled', 1],
      ]);
    });
  });

  it('valida o período personalizado', async () => {
    const missing = await request(ctx.app)
      .get('/metrics/summary?preset=custom&from=2026-10-01')
      .set('Authorization', admin)
      .expect(400);
    expect(missing.body.issues[0]).toMatchObject({ path: 'from' });
    await request(ctx.app)
      .get('/metrics/summary?preset=custom&from=2026-10-10&to=2026-10-01')
      .set('Authorization', admin)
      .expect(400);
    await request(ctx.app)
      .get('/metrics/summary?preset=custom&from=2020-01-01&to=2026-01-01')
      .set('Authorization', admin)
      .expect(400);
    await request(ctx.app)
      .get('/metrics/summary?preset=ontem')
      .set('Authorization', admin)
      .expect(400);
  });
});
