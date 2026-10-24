import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { User } from '../domain/entities/User';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { ShowProfileService } from './ShowProfileService';
import { UpdateProfileService } from './UpdateProfileService';

describe('ShowProfileService / UpdateProfileService', () => {
  let usersRepository: FakeUsersRepository;
  let updateProfile: UpdateProfileService;
  let user: User;

  beforeEach(async () => {
    usersRepository = new FakeUsersRepository();
    updateProfile = new UpdateProfileService(
      usersRepository,
      new FakeHashProvider(),
    );
    user = await usersRepository.create({
      name: 'Kaio',
      email: 'kaio@test.com',
      password: 'hashed:old',
    });
  });

  it('mostra o perfil do usuário', async () => {
    const profile = await new ShowProfileService(usersRepository).execute({
      user_id: user.id,
    });
    expect(profile.email).toBe('kaio@test.com');
  });

  it('responde 404 para usuário inexistente', async () => {
    await expect(
      new ShowProfileService(usersRepository).execute({ user_id: 'nope' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('atualiza nome e e-mail mantendo o próprio e-mail', async () => {
    const updated = await updateProfile.execute({
      user_id: user.id,
      name: 'Kaio F',
      email: 'kaio@test.com',
    });
    expect(updated.name).toBe('Kaio F');
  });

  it('não permite usar o e-mail de outro usuário', async () => {
    await usersRepository.create({
      name: 'Ana',
      email: 'ana@test.com',
      password: 'x',
    });

    await expect(
      updateProfile.execute({
        user_id: user.id,
        name: 'Kaio',
        email: 'ana@test.com',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('exige a senha antiga para trocar a senha', async () => {
    await expect(
      updateProfile.execute({
        user_id: user.id,
        name: 'Kaio',
        email: 'kaio@test.com',
        password: 'nova',
      }),
    ).rejects.toThrow('You need to inform the old password');
  });

  it('rejeita senha antiga incorreta', async () => {
    await expect(
      updateProfile.execute({
        user_id: user.id,
        name: 'Kaio',
        email: 'kaio@test.com',
        password: 'nova',
        old_password: 'errada',
      }),
    ).rejects.toThrow('Old password does not match');
  });

  it('troca a senha quando a antiga confere', async () => {
    const updated = await updateProfile.execute({
      user_id: user.id,
      name: 'Kaio',
      email: 'kaio@test.com',
      password: 'nova',
      old_password: 'old',
    });
    expect(updated.password).toBe('hashed:nova');
  });
});
