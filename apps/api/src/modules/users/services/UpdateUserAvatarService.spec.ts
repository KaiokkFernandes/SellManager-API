import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeStorageProvider } from '@shared/providers/StorageProvider/FakeStorageProvider';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { UpdateUserAvatarService } from './UpdateUserAvatarService';

const avatar = { content: Buffer.from('x'), contentType: 'image/png' as const };

describe('UpdateUserAvatarService', () => {
  let usersRepository: FakeUsersRepository;
  let storage: FakeStorageProvider;
  let updateAvatar: UpdateUserAvatarService;

  const createUser = () =>
    usersRepository.create({
      role: 'SELLER',
      name: 'Kaio',
      email: 'k@test.com',
      password: 'x',
    });

  beforeEach(() => {
    usersRepository = new FakeUsersRepository();
    storage = new FakeStorageProvider();
    updateAvatar = new UpdateUserAvatarService(usersRepository, storage);
  });

  it('salva o avatar e remove o anterior', async () => {
    const user = await createUser();

    await updateAvatar.execute({ user_id: user.id, avatar });
    const updated = await updateAvatar.execute({ user_id: user.id, avatar });

    expect([...storage.files]).toEqual([updated.avatar]);
  });

  it('se o banco falhar, mantém a foto anterior e apaga a nova', async () => {
    const user = await createUser();
    const { avatar: previous } = await updateAvatar.execute({
      user_id: user.id,
      avatar,
    });
    vi.spyOn(usersRepository, 'save').mockRejectedValueOnce(
      new Error('banco fora do ar'),
    );

    await expect(
      updateAvatar.execute({ user_id: user.id, avatar }),
    ).rejects.toThrow('banco fora do ar');

    expect([...storage.files]).toEqual([previous]);
  });

  it('rejeita usuário inexistente', async () => {
    await expect(
      updateAvatar.execute({ user_id: 'nope', avatar }),
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(storage.files.size).toBe(0);
  });
});
