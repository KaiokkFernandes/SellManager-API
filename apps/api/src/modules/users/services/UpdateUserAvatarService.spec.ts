import { beforeEach, describe, expect, it } from 'vitest';
import { FakeStorageProvider } from '@shared/providers/StorageProvider/FakeStorageProvider';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { UpdateUserAvatarService } from './UpdateUserAvatarService';

describe('UpdateUserAvatarService', () => {
  let usersRepository: FakeUsersRepository;
  let storage: FakeStorageProvider;
  let updateAvatar: UpdateUserAvatarService;

  beforeEach(() => {
    usersRepository = new FakeUsersRepository();
    storage = new FakeStorageProvider();
    updateAvatar = new UpdateUserAvatarService(usersRepository, storage);
  });

  it('salva o avatar e remove o anterior', async () => {
    const user = await usersRepository.create({
      role: 'SELLER',
      name: 'Kaio',
      email: 'k@test.com',
      password: 'x',
    });

    await updateAvatar.execute({ user_id: user.id, avatarFileName: 'a.png' });
    const updated = await updateAvatar.execute({
      user_id: user.id,
      avatarFileName: 'b.png',
    });

    expect(updated.avatar).toBe('b.png');
    expect([...storage.files]).toEqual(['b.png']);
  });

  it('rejeita usuário inexistente', async () => {
    await expect(
      updateAvatar.execute({ user_id: 'nope', avatarFileName: 'a.png' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
