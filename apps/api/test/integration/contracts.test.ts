import {
  apiErrorSchema,
  customerSchema,
  orderSchema,
  paginatedSchema,
  productSchema,
  sessionSchema,
  userSchema,
} from '@sellmanager/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  closeDatabase,
  createTestContext,
  defaultUser,
  resetDatabase,
  TestContext,
} from './helpers';

/** Falha com a lista de diferenças se a resposta não seguir o contrato do shared. */
function expectContract(schema: z.ZodType, body: unknown): void {
  const result = schema.safeParse(body);
  expect(
    result.success,
    result.error ? z.prettifyError(result.error) : '',
  ).toBe(true);
}

// Garante que o JSON da API segue os DTOs de @sellmanager/shared usados pelo front-end.
describe('Contratos de resposta (@sellmanager/shared)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(resetDatabase);
  afterAll(closeDatabase);

  it('usuários, sessão, produtos, clientes, pedidos e erros', async () => {
    const created = await request(ctx.app)
      .post('/users')
      .send(defaultUser)
      .expect(201);
    expectContract(userSchema, created.body);

    const session = await request(ctx.app)
      .post('/sessions')
      .send({ email: defaultUser.email, password: defaultUser.password })
      .expect(200);
    expectContract(sessionSchema, session.body);
    const auth = `Bearer ${session.body.token as string}`;

    const users = await request(ctx.app)
      .get('/users')
      .set('Authorization', auth)
      .expect(200);
    expectContract(paginatedSchema(userSchema), users.body);

    const product = await request(ctx.app)
      .post('/products')
      .set('Authorization', auth)
      .send({ name: 'Teclado', price_cents: 19990, quantity: 10 })
      .expect(201);
    expectContract(productSchema, product.body);
    expectContract(
      paginatedSchema(productSchema),
      (await request(ctx.app).get('/products')).body,
    );

    const customer = await request(ctx.app)
      .post('/customers')
      .set('Authorization', auth)
      .send({ name: 'Ana', email: 'ana@test.com' })
      .expect(201);
    expectContract(customerSchema, customer.body);

    const order = await request(ctx.app)
      .post('/orders')
      .set('Authorization', auth)
      .send({
        customer_id: customer.body.id,
        products: [{ id: product.body.id, quantity: 2 }],
      })
      .expect(201);
    expectContract(orderSchema, order.body);
    expectContract(
      paginatedSchema(orderSchema),
      (await request(ctx.app).get('/orders').set('Authorization', auth)).body,
    );

    const validationError = await request(ctx.app)
      .post('/customers')
      .set('Authorization', auth)
      .send({})
      .expect(400);
    expectContract(apiErrorSchema, validationError.body);
    expectContract(
      apiErrorSchema,
      (await request(ctx.app).get('/nao-existe').expect(404)).body,
    );
  });
});
