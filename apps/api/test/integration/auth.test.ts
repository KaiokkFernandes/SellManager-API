import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticate,
  closeDatabase,
  createUser,
  login,
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

  it('ADMIN cadastra, o usuário faz login e acessa o perfil sem expor a senha', async () => {
    const admin = await authenticate(ctx, { email: 'admin@test.com' });
    const created = await request(ctx.app)
      .post('/users')
      .set('Authorization', admin)
      .send({ ...defaultUser, role: 'SELLER' })
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

  it('o cadastro não é público', async () => {
    await request(ctx.app).post('/users').send(defaultUser).expect(401);
  });

  it('valida o cadastro (senha curta, e-mail inválido) e rejeita e-mail duplicado', async () => {
    const admin = await authenticate(ctx, { email: 'admin@test.com' });
    const invalid = await request(ctx.app)
      .post('/users')
      .set('Authorization', admin)
      .send({ name: '', email: 'nao-e-email', password: '123' })
      .expect(400);
    expect(invalid.body.code).toBe('VALIDATION_FAILED');
    // nome, e-mail, senha e papel
    expect(invalid.body.issues).toHaveLength(4);

    const create = () =>
      request(ctx.app)
        .post('/users')
        .set('Authorization', admin)
        .send({ ...defaultUser, role: 'SELLER' });
    await create().expect(201);
    await create().expect(409);
  });

  it('responde 401 com a mesma mensagem para e-mail inexistente e senha errada', async () => {
    await createUser(ctx);

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
    const auth = await authenticate(ctx);

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

  it('edita o próprio nome; e-mail e papel não mudam pelo perfil', async () => {
    const auth = await authenticate(ctx, { role: 'SELLER' });

    const updated = await request(ctx.app)
      .put('/profile')
      .set('Authorization', auth)
      .send({ name: 'Kaio F', email: 'outro@test.com', role: 'ADMIN' })
      .expect(200);
    expect(updated.body).toMatchObject({
      name: 'Kaio F',
      email: defaultUser.email,
      role: 'SELLER',
    });
  });

  it('troca a senha exigindo a atual e encerra as outras sessões', async () => {
    const other = await authenticate(ctx);
    const current = await login(ctx, defaultUser);
    const change = (body: object) =>
      request(ctx.app)
        .put('/profile/password')
        .set('Authorization', current)
        .send(body);

    const wrong = await change({
      current_password: 'errada-123',
      password: 'nova-senha-123',
      password_confirmation: 'nova-senha-123',
    }).expect(400);
    expect(wrong.body.issues).toEqual([
      expect.objectContaining({ segment: 'body', path: 'current_password' }),
    ]);
    await change({
      current_password: defaultUser.password,
      password: 'nova-senha-123',
      password_confirmation: 'outra',
    })
      .expect(400)
      .expect(response =>
        // motivo declarado no shared, texto em inglês dado pela API
        expect(response.body.issues[0]).toMatchObject({
          path: 'password_confirmation',
          message: 'Passwords do not match',
        }),
      );

    // o iat tem resolução de segundos: espera virar o segundo para o corte ser nítido
    await new Promise(resolve => setTimeout(resolve, 1100));
    const changed = await change({
      current_password: defaultUser.password,
      password: 'nova-senha-123',
      password_confirmation: 'nova-senha-123',
    }).expect(200);

    // a outra sessão caiu; a atual segue com o token novo
    await request(ctx.app)
      .get('/profile')
      .set('Authorization', other)
      .expect(401);
    await request(ctx.app)
      .get('/profile')
      .set('Authorization', `Bearer ${changed.body.token as string}`)
      .expect(200);
    await login(ctx, { email: defaultUser.email, password: 'nova-senha-123' });
  });

  it('recupera a senha pelo link do e-mail; o token é de uso único', async () => {
    await createUser(ctx);

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
    const auth = await authenticate(ctx);

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
