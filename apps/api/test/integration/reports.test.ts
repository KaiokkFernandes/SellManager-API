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

const OCTOBER = { preset: 'custom', from: '2026-10-01', to: '2026-10-31' };

/** Corpo cru (o supertest não interpreta text/csv como JSON). */
function raw(response: request.Response): string {
  return Buffer.from(response.body as Buffer).toString('utf8');
}

describe('/reports (CSV)', () => {
  let ctx: TestContext;
  let admin: string;
  let customerId: string;
  let productId: string;

  const csv = (name: string, query: object = OCTOBER, auth = admin) =>
    request(ctx.app)
      .get(`/reports/${name}`)
      .query(query)
      .set('Authorization', auth)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });

  const lines = (response: request.Response) =>
    raw(response)
      .replace(/^\uFEFF/, '')
      .split('\r\n')
      .filter(Boolean);

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    admin = await authenticate(ctx);
    customerId = (
      await request(ctx.app)
        .post('/customers')
        .set('Authorization', admin)
        .send({ name: 'João Conceição', email: 'joao@test.com' })
        .expect(201)
    ).body.id as string;
    productId = (
      await request(ctx.app)
        .post('/products')
        .set('Authorization', admin)
        .send({
          name: 'Cabo Ótico',
          price_cents: 123456,
          quantity: 50,
          min_stock: 60,
        })
        .expect(201)
    ).body.id as string;

    const order = async (
      units: number,
      paid: string | null,
      canceled?: string,
    ) => {
      const created = await request(ctx.app)
        .post('/orders')
        .set('Authorization', admin)
        .send({
          customer_id: customerId,
          products: [{ id: productId, quantity: units }],
        })
        .expect(201);
      await AppDataSource.query(
        `UPDATE orders SET status = $2, paid_at = $3::timestamptz, canceled_at = $4::timestamptz
         WHERE id = $1`,
        [
          created.body.id,
          canceled ? 'canceled' : paid ? 'delivered' : 'pending',
          paid,
          canceled ?? null,
        ],
      );
    };
    await order(2, '2026-11-01T02:30:00Z'); // 31/10 23:30 em SP: entra
    await order(1, '2026-10-10T15:00:00Z');
    await order(3, '2026-10-12T15:00:00Z', '2026-10-13T15:00:00Z'); // cancelado: fora
    await order(1, null); // pendente: fora
  });
  afterAll(closeDatabase);

  it('vendas: arquivo pt-BR com BOM, ";" e vírgula decimal, só vendas do período', async () => {
    const response = await csv('sales').expect(200);

    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toContain(
      'filename="vendas_2026-10-01_a_2026-10-31.csv"',
    );
    expect(raw(response).startsWith('\uFEFF')).toBe(true);
    const [header, ...rows] = lines(response);
    expect(header).toBe(
      'Pedido;Data do pagamento;Cliente;E-mail;Status;Itens;Total (R$);Criado por;ID do pedido',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatch(
      /^\w{8};10\/10\/2026 12:00;João Conceição;joao@test\.com;Entregue;1;1234,56;Kaio;[\w-]{36}$/,
    );
    expect(rows[1]).toContain('31/10/2026 23:30;João Conceição');
    expect(rows[1]).toContain(';2;2469,12;');
  });

  it('produtos: estoque, abaixo do mínimo e vendido no período; filtro', async () => {
    const response = await csv('products').expect(200);
    expect(lines(response)).toEqual([
      'Produto;Categoria;Preço (R$);Estoque;Estoque mínimo;Abaixo do mínimo;Unidades vendidas no período;Faturamento no período (R$)',
      // 50 − 2 − 1 − 3 − 1 = 43 (o "cancelado" foi forçado no banco, sem devolver)
      'Cabo Ótico;;1234,56;43;60;Sim;3;3703,68',
    ]);
    const none = await csv('products', {
      ...OCTOBER,
      below_min_stock: 'false',
      category_id: '00000000-0000-4000-8000-000000000000',
    }).expect(200);
    expect(lines(none)).toHaveLength(1);
  });

  it('clientes: total comprado e última compra; só quem comprou por padrão', async () => {
    await request(ctx.app)
      .post('/customers')
      .set('Authorization', admin)
      .send({ name: 'Sem Compras', email: 'nada@test.com' })
      .expect(201);

    const buyers = lines(await csv('customers').expect(200));
    expect(buyers).toEqual([
      'Cliente;E-mail;Pedidos no período;Total comprado no período (R$);Última compra no período',
      'João Conceição;joao@test.com;2;3703,68;31/10/2026 23:30',
    ]);
    const all = lines(
      await csv('customers', { ...OCTOBER, only_buyers: 'false' }).expect(200),
    );
    expect(all.at(-1)).toBe('Sem Compras;nada@test.com;0;0,00;');
  });

  it('muitas linhas saem completas (vários lotes do cursor)', async () => {
    await AppDataSource.query(
      `INSERT INTO customers (name, email)
       SELECT 'Cliente ' || n, 'c' || n || '@test.com' FROM generate_series(1, 1200) n`,
    );
    const all = lines(
      await csv('customers', { ...OCTOBER, only_buyers: 'false' }).expect(200),
    );
    expect(all).toHaveLength(1 + 1201);
  });

  it('SELLER não exporta (403); período inválido é 400 em JSON', async () => {
    const seller = await authenticate(ctx, {
      email: 'vendedor@test.com',
      role: 'SELLER',
    });
    await request(ctx.app)
      .get('/reports/sales')
      .set('Authorization', seller)
      .expect(403);
    const invalid = await request(ctx.app)
      .get('/reports/sales?preset=custom')
      .set('Authorization', admin)
      .expect(400);
    expect(invalid.body.code).toBe('VALIDATION_FAILED');
  });
});
