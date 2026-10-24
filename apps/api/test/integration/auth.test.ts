import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createTestContext,
  defaultUser,
  resetDatabase,
  TestContext,
} from './helpers';

describe('Usuários, sessão, perfil e senha', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  beforeEach(async () => {
    await resetDatabase();
    ctx.mail.messages.length = 0;
  });
  afterAll(closeDatabase);

  it('cadastra, faz login e acessa o perfil sem expor a senha', async () => {
    const created = await request(ctx.app)
      .post('/users')
      .send(defaultUser)
      .expect(201);
    expect(created.body).not.toHaveProperty('password');

    const session = await request(ctx.app)
      .post('/sessions')
      .send({ email: 'KAIO@test.com ', password: defaultUser.password })
      .expect(200);
    expect(session.body.user).not.toHaveProperty('password');

    const profile = await request(ctx.app)
      .get('/profile')
      .set('Authorization', `Bearer ${session.body.token as string}`)
      .expect(200);
    expect(profile.body).toMatchObject({
      email: defaultUser.email,
      name: defaultUser.name,
    });
  });

  it('valida o cadastro (senha curta, e-mail inválido) e rejeita e-mail duplicado', async () => {
    const invalid = await request(ctx.app)
      .post('/users')
      .send({ name: '', email: 'nao-e-email', password: '123' })
      .expect(400);
    expect(invalid.body.details).toHaveLength(3);

    await request(ctx.app).post('/users').send(defaultUser).expect(201);
    await request(ctx.app).post('/users').send(defaultUser).expect(409);
  });

  it('responde 401 com a mesma mensagem para e-mail inexistente e senha errada', async () => {
    await request(ctx.app).post('/users').send(defaultUser).expect(201);

    const wrongPassword = await request(ctx.app)
      .post('/sessions')
      .send({ email: defaultUser.email, password: 'errada-123' })
      .expect(401);
    const unknownEmail = await request(ctx.app)
      .post('/sessions')
      .send({ email: 'ninguem@test.com', password: 'errada-123' })
      .expect(401);

    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('protege rotas autenticadas', async () => {
    await request(ctx.app).get('/profile').expect(401);
    await request(ctx.app)
      .get('/profile')
      .set('Authorization', 'Bearer invalido')
      .expect(401);
    await request(ctx.app).get('/users').expect(401);
  });

  it('lista usuários paginado', async () => {
    const auth = await authenticate(ctx.app);

    const response = await request(ctx.app)
      .get('/users?limit=5')
      .set('Authorization', auth)
      .expect(200);

    expect(response.body.meta).toEqual({
      page: 1,
      limit: 5,
      total: 1,
      total_pages: 1,
    });
  });

  it('atualiza o perfil e troca a senha exigindo a senha antiga', async () => {
    const auth = await authenticate(ctx.app);
    const update = {
      name: 'Kaio F',
      email: defaultUser.email,
      password: 'nova-senha-123',
      password_confirmation: 'nova-senha-123',
    };

    await request(ctx.app)
      .put('/profile')
      .set('Authorization', auth)
      .send(update)
      .expect(400);
    await request(ctx.app)
      .put('/profile')
      .set('Authorization', auth)
      .send({ ...update, old_password: defaultUser.password })
      .expect(200);

    await request(ctx.app)
      .post('/sessions')
      .send({ email: defaultUser.email, password: 'nova-senha-123' })
      .expect(200);
  });

  it('recupera a senha pelo link do e-mail; o token é de uso único', async () => {
    await request(ctx.app).post('/users').send(defaultUser).expect(201);

    await request(ctx.app)
      .post('/password/forgot')
      .send({ email: defaultUser.email })
      .expect(204);
    await request(ctx.app)
      .post('/password/forgot')
      .send({ email: 'ninguem@test.com' })
      .expect(204);
    expect(ctx.mail.messages).toHaveLength(1);

    const link = String(ctx.mail.messages[0]?.templateData.variables.link);
    const token = new URL(link).searchParams.get('token');
    const reset = {
      token,
      password: 'senha-recuperada',
      password_confirmation: 'senha-recuperada',
    };

    await request(ctx.app).post('/password/reset').send(reset).expect(204);
    await request(ctx.app).post('/password/reset').send(reset).expect(400);
    await request(ctx.app)
      .post('/sessions')
      .send({ email: defaultUser.email, password: 'senha-recuperada' })
      .expect(200);
  });

  it('envia avatar de imagem e rejeita outros tipos', async () => {
    const auth = await authenticate(ctx.app);

    await request(ctx.app)
      .patch('/users/avatar')
      .set('Authorization', auth)
      .attach('avatar', Buffer.from('<script>alert(1)</script>'), {
        filename: 'x.html',
        contentType: 'text/html',
      })
      .expect(400);

    const response = await request(ctx.app)
      .patch('/users/avatar')
      .set('Authorization', auth)
      .attach('avatar', Buffer.from('fake-png'), {
        filename: 'a.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(response.body.avatar).toMatch(/^[a-f0-9]{32}\.png$/);
    await request(ctx.app)
      .get(`/files/${response.body.avatar as string}`)
      .expect(200);
  });
});
