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
