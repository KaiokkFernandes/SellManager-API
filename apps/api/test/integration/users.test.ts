import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CreateFirstAdminService } from '@modules/users/services/CreateFirstAdminService';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import {
  closeDatabase,
  createTestContext,
  createUser,
  login,
  resetDatabase,
  TestContext,
} from './helpers';

describe('gestão de usuários (ADMIN)', () => {
  let ctx: TestContext;
  let admin: Awaited<ReturnType<typeof createUser>>;
  let auth: string;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    ctx.mail.messages.length = 0;
    admin = await createUser(ctx, { name: 'Admin', email: 'admin@test.com' });
    auth = await login(ctx, admin);
  });
  afterAll(closeDatabase);

  const createSeller = async () =>
    (
      await request(ctx.app)
        .post('/users')
        .set('Authorization', auth)
        .send({
          name: 'Bia',
          email: 'bia@test.com',
          password: 'senha-inicial-123',
          role: 'SELLER',
        })
        .expect(201)
    ).body as { id: string; role: string; active: boolean };

  it('cria com papel e senha inicial; o usuário entra com ela', async () => {
    const seller = await createSeller();
    expect(seller).toMatchObject({ role: 'SELLER', active: true });

    const session = await request(ctx.app)
      .post('/sessions')
      .send({ email: 'bia@test.com', password: 'senha-inicial-123' })
      .expect(200);
    expect(session.body.user.role).toBe('SELLER');
  });

  it('lista com busca e filtros de papel e situação', async () => {
    const seller = await createSeller();
    await request(ctx.app)
      .patch(`/users/${seller.id}/status`)
      .set('Authorization', auth)
      .send({ active: false })
      .expect(200);

    const list = (query: string) =>
      request(ctx.app).get(`/users?${query}`).set('Authorization', auth);
    expect((await list('role=SELLER')).body.meta.total).toBe(1);
    expect((await list('status=active')).body.data[0].email).toBe(
      'admin@test.com',
    );
    expect((await list('status=inactive&q=BIA')).body.meta.total).toBe(1);
    await list('role=ROOT').expect(400);
  });

  it('edita nome e papel; o novo papel vale na hora para o token existente', async () => {
    const seller = await createSeller();
    const sellerAuth = await login(ctx, {
      email: 'bia@test.com',
      password: 'senha-inicial-123',
    });
    await request(ctx.app)
      .get('/users')
      .set('Authorization', sellerAuth)
      .expect(403);

    const updated = await request(ctx.app)
      .put(`/users/${seller.id}`)
      .set('Authorization', auth)
      .send({ name: 'Bia Lima', role: 'ADMIN' })
      .expect(200);
    expect(updated.body).toMatchObject({ name: 'Bia Lima', role: 'ADMIN' });

    await request(ctx.app)
      .get('/users')
      .set('Authorization', sellerAuth)
      .expect(200);
  });

  it('desativado perde a sessão, não entra (403 só com a senha certa) e não recupera senha', async () => {
    const seller = await createSeller();
    const sellerAuth = await login(ctx, {
      email: 'bia@test.com',
      password: 'senha-inicial-123',
    });

    await request(ctx.app)
      .patch(`/users/${seller.id}/status`)
      .set('Authorization', auth)
      .send({ active: false })
      .expect(200);

    await request(ctx.app)
      .get('/profile')
      .set('Authorization', sellerAuth)
      .expect(401);
    const disabled = await request(ctx.app)
      .post('/sessions')
      .send({ email: 'bia@test.com', password: 'senha-inicial-123' })
      .expect(403);
    expect(disabled.body.code).toBe('ACCOUNT_DISABLED');
    // senha errada continua 401: não revela que a conta existe
    await request(ctx.app)
      .post('/sessions')
      .send({ email: 'bia@test.com', password: 'errada-123' })
      .expect(401);
    await request(ctx.app)
      .post('/password/forgot')
      .send({ email: 'bia@test.com' })
      .expect(204);
    expect(ctx.mail.messages).toHaveLength(0);

    await request(ctx.app)
      .patch(`/users/${seller.id}/status`)
      .set('Authorization', auth)
      .send({ active: true })
      .expect(200);
    await login(ctx, { email: 'bia@test.com', password: 'senha-inicial-123' });
  });

  it('não muda o próprio papel, não se desativa e não rebaixa o último ADMIN', async () => {
    const self = await request(ctx.app)
      .put(`/users/${admin.id}`)
      .set('Authorization', auth)
      .send({ name: 'Admin', role: 'MANAGER' })
      .expect(409);
    expect(self.body).toMatchObject({
      code: 'CONFLICT',
      details: { reason: 'SELF' },
    });
    await request(ctx.app)
      .patch(`/users/${admin.id}/status`)
      .set('Authorization', auth)
      .send({ active: false })
      .expect(409);

    // o último ADMIN só existe "sozinho" se outro admin rebaixar o penúltimo:
    const other = await createUser(ctx, { email: 'outro@test.com' });
    const otherAuth = await login(ctx, other);
    await request(ctx.app)
      .put(`/users/${other.id}`)
      .set('Authorization', auth)
      .send({ name: 'Outro', role: 'MANAGER' })
      .expect(200);
    // `other` agora é MANAGER: não tem mais user:update
    await request(ctx.app)
      .put(`/users/${admin.id}`)
      .set('Authorization', otherAuth)
      .send({ name: 'Admin', role: 'MANAGER' })
      .expect(403);
  });

  it('dois ADMINs se rebaixando ao mesmo tempo: sobra pelo menos um ADMIN ativo', async () => {
    const other = await createUser(ctx, { email: 'outro@test.com' });
    const otherAuth = await login(ctx, other);

    const [first, second] = await Promise.all([
      request(ctx.app)
        .put(`/users/${other.id}`)
        .set('Authorization', auth)
        .send({ name: 'Outro', role: 'SELLER' }),
      request(ctx.app)
        .put(`/users/${admin.id}`)
        .set('Authorization', otherAuth)
        .send({ name: 'Admin', role: 'SELLER' }),
    ]);

    const statuses = [first.status, second.status].sort();
    // um passa; o outro ou vê que é o último ADMIN (409) ou já perdeu a permissão (403)
    expect(statuses[0]).toBe(200);
    expect([403, 409]).toContain(statuses[1]);
    const [{ count }] = await AppDataSource.query<[{ count: number }]>(
      "SELECT count(*)::int AS count FROM users WHERE role = 'ADMIN' AND active",
    );
    expect(count).toBe(1);
  });

  it('instalação: banco sem ADMIN ganha o primeiro; com ADMIN nada muda', async () => {
    const firstAdmin = new CreateFirstAdminService(
      ctx.container.usersUnitOfWork,
      ctx.container.providers.hash,
    );
    const data = {
      name: 'Dona',
      email: 'dona@test.com',
      password: 'senha-forte-123',
    };

    expect(await firstAdmin.execute(data)).toBeNull(); // o do beforeEach está ativo

    await resetDatabase();
    const created = await firstAdmin.execute(data);
    expect(created).toMatchObject({ role: 'ADMIN', active: true });

    const session = await login(ctx, data);
    await request(ctx.app)
      .get('/users')
      .set('Authorization', session)
      .expect(200);
  });

  it('404 para usuário inexistente', async () => {
    await request(ctx.app)
      .get('/users/00000000-0000-4000-8000-000000000000')
      .set('Authorization', auth)
      .expect(404);
  });
});
