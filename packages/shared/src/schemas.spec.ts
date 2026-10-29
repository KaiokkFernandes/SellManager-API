import { describe, expect, it } from 'vitest';
import {
  createOrderBodySchema,
  createUserBodySchema,
  paginatedSchema,
  paginationQuerySchema,
  productSchema,
} from './index';

describe('@sellmanager/shared', () => {
  it('normaliza o e-mail (trim + minúsculas) antes de validar', () => {
    const body = createUserBodySchema.parse({
      name: ' Kaio ',
      email: ' KAIO@Test.com ',
      password: 'senha-segura',
      role: 'SELLER',
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

  it('valida o envelope paginado', () => {
    const now = new Date().toISOString();
    const page = {
      data: [
        {
          id: crypto.randomUUID(),
          name: 'Teclado',
          price_cents: 19990,
          quantity: 1,
          min_stock: 0,
          below_min_stock: false,
          category: null,
          image_url: null,
          created_at: now,
          updated_at: now,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, total_pages: 1 },
    };

    expect(paginatedSchema(productSchema).parse(page)).toEqual(page);
  });
});

describe('contrato de rotas', () => {
  it('tem operationId e path+método únicos', async () => {
    const { allRoutes } = await import('./index');
    const ids = allRoutes.map(route => route.operationId);
    const keys = allRoutes.map(route => `${route.method} ${route.path}`);

    expect(allRoutes).toHaveLength(47);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('deduz os erros automáticos de cada rota', async () => {
    const { routes } = await import('./index');

    // permissão específica => 403; 'authenticated' => só 401
    expect(routes.products.show.errorStatuses).toEqual([
      400, 401, 403, 404, 500,
    ]);
    expect(routes.orders.create.errorStatuses).toEqual([
      400, 401, 403, 404, 409, 413, 500,
    ]);
    // 403 = conta desativada (declarado na rota)
    expect(routes.sessions.create.errorStatuses).toEqual([
      400, 401, 403, 413, 429, 500,
    ]);
    expect(routes.users.updateAvatar.errorStatuses).toEqual([400, 401, 500]);
    expect(routes.profile.show.errorStatuses).toEqual([401, 404, 500]);
  });

  it('toda rota autenticada declara a permissão', async () => {
    const { allRoutes, PERMISSIONS } = await import('./index');
    for (const route of allRoutes.filter(item => item.auth)) {
      expect([...PERMISSIONS, 'authenticated']).toContain(route.permission);
    }
  });
});
