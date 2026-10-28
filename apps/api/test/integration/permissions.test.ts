import {
  allRoutes,
  can,
  PERMISSIONS,
  ROLES,
  type Role,
} from '@sellmanager/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  resetDatabase,
  TestContext,
} from './helpers';

/**
 * Matriz papel × rota gerada do contrato e do mapa de permissões: uma rota ou
 * permissão nova entra no teste sozinha. A autorização roda antes da validação,
 * então ids fictícios e corpo vazio bastam: quem não pode recebe 403; quem
 * pode recebe qualquer outra coisa (200, 400, 404…), nunca 403.
 */
const FAKE_ID = '00000000-0000-4000-8000-000000000000';
const protectedRoutes = allRoutes.filter(
  route => route.auth && route.permission !== 'authenticated',
);

describe('matriz de permissões (gerada do mapa)', () => {
  let ctx: TestContext;
  const tokens = {} as Record<Role, string>;

  beforeAll(async () => {
    ctx = await createTestContext();
    await resetDatabase();
    for (const role of ROLES) {
      tokens[role] = await authenticate(ctx, {
        email: `${role.toLowerCase()}@test.com`,
        role,
      });
    }
  });
  afterAll(closeDatabase);

  it('toda permissão do mapa protege alguma rota (exceto as reservadas)', () => {
    const used = new Set(protectedRoutes.map(route => route.permission));
    // report:read fica reservada para a feature de relatórios
    expect(PERMISSIONS.filter(permission => !used.has(permission))).toEqual([
      'report:read',
      'user:update',
    ]);
  });

  const cases = protectedRoutes.flatMap(route =>
    ROLES.map(role => ({
      role,
      route,
      allowed: can(role, route.permission as never),
    })),
  );

  it.each(cases)(
    '$role → $route.method $route.path ($route.permission): permitido=$allowed',
    async ({ role, route, allowed }) => {
      const path = route.path.replace(/\{\w+\}/g, FAKE_ID);
      const response = await request(ctx.app)
        [route.method](path)
        .set('Authorization', tokens[role])
        .send({});

      if (allowed) {
        expect(response.status).not.toBe(403);
      } else {
        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          status: 'error',
          code: 'FORBIDDEN',
          details: { permission: route.permission },
        });
      }
    },
  );

  it('rotas "authenticated" (perfil) valem para todos os papéis', async () => {
    for (const role of ROLES) {
      await request(ctx.app)
        .get('/profile')
        .set('Authorization', tokens[role])
        .expect(200);
    }
  });
});
