import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeUsersRepository } from '@modules/users/fakes/FakeUsersRepository';
import { User } from '@modules/users/domain/entities/User';
import AppError from '@shared/errors/AppError';
import { FakeTokenProvider } from '@shared/providers/TokenProvider/FakeTokenProvider';
import { ensureAuthenticated } from './ensureAuthenticated';

async function run(
  middleware: ReturnType<typeof ensureAuthenticated>,
  authorization?: string,
) {
  const request = { headers: { authorization } } as Request;
  const next = vi.fn();
  middleware(request, {} as Response, next);
  await vi.waitFor(() => expect(next).toHaveBeenCalled());
  return { request, error: next.mock.calls[0]?.[0] as AppError | undefined };
}

describe('ensureAuthenticated', () => {
  let users: FakeUsersRepository;
  let tokens: FakeTokenProvider;
  let user: User;
  let middleware: ReturnType<typeof ensureAuthenticated>;

  beforeEach(async () => {
    users = new FakeUsersRepository();
    tokens = new FakeTokenProvider();
    user = await users.create({
      name: 'Ana',
      email: 'ana@test.com',
      password: 'hash',
      role: 'MANAGER',
    });
    middleware = ensureAuthenticated(tokens, users);
  });

  it('carrega id e papel do banco', async () => {
    const token = await tokens.sign({ subject: user.id });
    const { request, error } = await run(middleware, `Bearer ${token}`);

    expect(error).toBeUndefined();
    expect(request.user).toEqual({ id: user.id, role: 'MANAGER' });
  });

  it('o papel alterado vale na hora, sem novo login', async () => {
    const token = await tokens.sign({ subject: user.id });
    await users.save({ ...user, role: 'SELLER' });

    const { request } = await run(middleware, `Bearer ${token}`);
    expect(request.user.role).toBe('SELLER');
  });

  it.each([
    ['sem header', undefined],
    ['esquema errado', 'Basic abc'],
    ['token inválido', 'Bearer lixo'],
  ])('401 com %s', async (_case, header) => {
    const { error } = await run(middleware, header);
    expect(error).toMatchObject({ statusCode: 401 });
  });

  it('401 para usuário desativado ou inexistente', async () => {
    const token = await tokens.sign({ subject: user.id });
    await users.save({ ...user, active: false });
    expect((await run(middleware, `Bearer ${token}`)).error).toMatchObject({
      statusCode: 401,
    });

    const ghost = await tokens.sign({ subject: 'nao-existe' });
    expect((await run(middleware, `Bearer ${ghost}`)).error).toMatchObject({
      statusCode: 401,
    });
  });

  it('401 para token emitido antes da última troca de senha', async () => {
    tokens.now = () => 1_000;
    const old = await tokens.sign({ subject: user.id });
    await users.save({ ...user, password_changed_at: new Date(2_000_000) });
    tokens.now = () => 2_000;
    const fresh = await tokens.sign({ subject: user.id });

    expect((await run(middleware, `Bearer ${old}`)).error).toMatchObject({
      statusCode: 401,
    });
    expect((await run(middleware, `Bearer ${fresh}`)).error).toBeUndefined();
  });
});
