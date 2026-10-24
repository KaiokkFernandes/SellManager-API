import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { FakeTokenProvider } from '@shared/providers/TokenProvider/FakeTokenProvider';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { AuthenticateUserService } from './AuthenticateUserService';

describe('AuthenticateUserService', () => {
  let usersRepository: FakeUsersRepository;
  let authenticateUser: AuthenticateUserService;

  beforeEach(async () => {
    usersRepository = new FakeUsersRepository();
    authenticateUser = new AuthenticateUserService(
      usersRepository,
      new FakeHashProvider(),
      new FakeTokenProvider(),
    );
    await usersRepository.create({
      name: 'Kaio',
      email: 'kaio@test.com',
      password: 'hashed:123456',
    });
  });

  it('autentica e emite um token com o id do usuário como subject', async () => {
    const { user, token } = await authenticateUser.execute({
      email: 'kaio@test.com',
      password: '123456',
    });

    expect(token).toBe(`token:${user.id}`);
  });

  it('rejeita e-mail inexistente com 401', async () => {
    await expect(
      authenticateUser.execute({ email: 'nao@existe.com', password: '123456' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Incorrect email/password combination.',
    });
  });

  it('rejeita senha errada com a mesma mensagem de e-mail inexistente', async () => {
    await expect(
      authenticateUser.execute({ email: 'kaio@test.com', password: 'errada' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Incorrect email/password combination.',
    });
  });
});
