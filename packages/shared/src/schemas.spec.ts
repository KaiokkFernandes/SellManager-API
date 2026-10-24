import { describe, expect, it } from 'vitest';
import {
  createOrderBodySchema,
  createUserBodySchema,
  ORDER_STATUSES,
  paginatedSchema,
  paginationQuerySchema,
  productSchema,
  updateOrderStatusBodySchema,
} from './index';

describe('@sellmanager/shared', () => {
  it('normaliza o e-mail (trim + minúsculas) antes de validar', () => {
    const body = createUserBodySchema.parse({
      name: ' Kaio ',
      email: ' KAIO@Test.com ',
      password: 'senha-segura',
    });

    expect(body).toMatchObject({ name: 'Kaio', email: 'kaio@test.com' });
  });

  it('converte page/limit da query string e aplica os padrões', () => {
    expect(paginationQuerySchema.parse({ page: '2' })).toEqual({
      page: 2,
      limit: 20,
    });
    expect(paginationQuerySchema.safeParse({ limit: '500' }).success).toBe(
      false,
    );
  });

  it('pedido exige ao menos um produto com quantidade positiva', () => {
    expect(
      createOrderBodySchema.safeParse({
        customer_id: crypto.randomUUID(),
        products: [],
      }).success,
    ).toBe(false);
  });

  it('não permite voltar um pedido para pending', () => {
    expect(ORDER_STATUSES).toContain('pending');
    expect(
      updateOrderStatusBodySchema.safeParse({ status: 'pending' }).success,
    ).toBe(false);
  });

  it('valida o envelope paginado', () => {
    const now = new Date().toISOString();
    const page = {
      data: [
        {
          id: crypto.randomUUID(),
          name: 'Teclado',
          price: 199.9,
          quantity: 1,
          created_at: now,
          updated_at: now,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, total_pages: 1 },
    };

    expect(paginatedSchema(productSchema).parse(page)).toEqual(page);
  });
});
