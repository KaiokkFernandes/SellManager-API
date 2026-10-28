import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { FakeTokenProvider } from '@shared/providers/TokenProvider/FakeTokenProvider';
import { User } from '../domain/entities/User';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { ChangePasswordService } from './ChangePasswordService';
import { ShowProfileService } from './ShowProfileService';
import { UpdateProfileService } from './UpdateProfileService';

describe('perfil próprio', () => {
  let usersRepository: FakeUsersRepository;
  let hash: FakeHashProvider;
  let user: User;

  beforeEach(async () => {
    usersRepository = new FakeUsersRepository();
    hash = new FakeHashProvider();
    user = await usersRepository.create({
      role: 'SELLER',
      name: 'Kaio',
      email: 'kaio@test.com',
      password: await hash.generateHash('senha-atual'),
    });
  });

  it('mostra o perfil e responde 404 para usuário inexistente', async () => {
    const show = new ShowProfileService(usersRepository);
    expect((await show.execute({ user_id: user.id })).email).toBe(
      'kaio@test.com',
    );
    await expect(show.execute({ user_id: 'nope' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('edita só o nome (papel e e-mail não mudam)', async () => {
    const updated = await new UpdateProfileService(usersRepository).execute({
      user_id: user.id,
      name: 'Kaio F',
    });
    expect(updated).toMatchObject({
      name: 'Kaio F',
      email: 'kaio@test.com',
      role: 'SELLER',
    });
  });

  it('troca a senha exigindo a atual, registra a data e emite token novo', async () => {
    const change = new ChangePasswordService(
      usersRepository,
      hash,
      new FakeTokenProvider(),
    );

    await expect(
      change.execute({
        user_id: user.id,
        current_password: 'errada',
        password: 'nova-senha',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      issues: [{ path: 'current_password' }],
    });

    const { user: saved, token } = await change.execute({
      user_id: user.id,
      current_password: 'senha-atual',
      password: 'nova-senha',
    });
    expect(await hash.compareHash('nova-senha', saved.password)).toBe(true);
    expect(saved.password_changed_at).toBeInstanceOf(Date);
    expect(token).toContain(user.id);
  });
});
