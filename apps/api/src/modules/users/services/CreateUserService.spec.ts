import { beforeEach, describe, expect, it } from 'vitest';
import AppError from '@shared/errors/AppError';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { CreateUserService } from './CreateUserService';

describe('CreateUserService', () => {
  let usersRepository: FakeUsersRepository;
  let createUser: CreateUserService;

  beforeEach(() => {
    usersRepository = new FakeUsersRepository();
    createUser = new CreateUserService(usersRepository, new FakeHashProvider());
  });

  it('cria o usuário com a senha em hash', async () => {
    const user = await createUser.execute({
      role: 'SELLER',
      name: 'Kaio',
      email: 'kaio@test.com',
      password: '123456',
    });

    expect(user.id).toBeDefined();
    expect(user.password).toBe('hashed:123456');
  });

  it('não permite e-mail duplicado', async () => {
    await createUser.execute({
      role: 'SELLER',
      name: 'Kaio',
      email: 'kaio@test.com',
      password: '123456',
    });

    await expect(
      createUser.execute({
        role: 'SELLER',
        name: 'Outro',
        email: 'kaio@test.com',
        password: '654321',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      createUser.execute({
        role: 'SELLER',
        name: 'Outro',
        email: 'kaio@test.com',
        password: '654321',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
