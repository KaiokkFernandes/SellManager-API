import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { User } from '../domain/entities/User';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { FakeUsersUnitOfWork } from '../fakes/FakeUsersUnitOfWork';
import { CreateUserService } from './CreateUserService';
import { ListUsersService } from './ListUsersService';
import { UpdateUserService } from './UpdateUserService';
import { UpdateUserStatusService } from './UpdateUserStatusService';

describe('gestão de usuários', () => {
  let users: FakeUsersRepository;
  let update: UpdateUserService;
  let setStatus: UpdateUserStatusService;
  let admin: User;
  let seller: User;

  const create = (name: string, role: User['role']) =>
    new CreateUserService(users, new FakeHashProvider()).execute({
      name,
      email: `${name.toLowerCase()}@test.com`,
      password: 'senha-123',
      role,
    });

  beforeEach(async () => {
    users = new FakeUsersRepository();
    const unitOfWork = new FakeUsersUnitOfWork(users);
    update = new UpdateUserService(unitOfWork);
    setStatus = new UpdateUserStatusService(unitOfWork);
    admin = await create('Admin', 'ADMIN');
    seller = await create('Bia', 'SELLER');
  });

  it('cria com o papel informado e lista com filtros', async () => {
    expect(seller.role).toBe('SELLER');
    const list = new ListUsersService(users);

    expect((await list.execute({ role: 'ADMIN' })).data).toHaveLength(1);
    expect((await list.execute({ search: 'bia' })).data[0]?.id).toBe(seller.id);
  });

  it('ADMIN muda nome e papel de outro usuário e desativa/reativa', async () => {
    const promoted = await update.execute({
      actorId: admin.id,
      id: seller.id,
      name: 'Bia Lima',
      role: 'MANAGER',
    });
    expect(promoted).toMatchObject({ name: 'Bia Lima', role: 'MANAGER' });

    expect(
      (
        await setStatus.execute({
          actorId: admin.id,
          id: seller.id,
          active: false,
        })
      ).active,
    ).toBe(false);
    expect(
      (
        await setStatus.execute({
          actorId: admin.id,
          id: seller.id,
          active: true,
        })
      ).active,
    ).toBe(true);
  });

  it('não muda o próprio papel nem se desativa, mas edita o próprio nome', async () => {
    await expect(
      update.execute({
        actorId: admin.id,
        id: admin.id,
        name: 'Admin',
        role: 'SELLER',
      }),
    ).rejects.toMatchObject({ statusCode: 409, details: { reason: 'SELF' } });
    await expect(
      setStatus.execute({ actorId: admin.id, id: admin.id, active: false }),
    ).rejects.toMatchObject({ statusCode: 409, details: { reason: 'SELF' } });

    const renamed = await update.execute({
      actorId: admin.id,
      id: admin.id,
      name: 'Admin Geral',
      role: 'ADMIN',
    });
    expect(renamed.name).toBe('Admin Geral');
  });

  it('o último ADMIN ativo não pode ser rebaixado nem desativado', async () => {
    const other = await create('Outro', 'ADMIN');
    // com dois admins, um rebaixa o outro…
    await update.execute({
      actorId: admin.id,
      id: other.id,
      name: 'Outro',
      role: 'MANAGER',
    });

    // …e o restante é o último: ninguém mais o rebaixa (aqui, um admin desativado tentando)
    const lastAdminGuard = { actorId: other.id, id: admin.id };
    await expect(
      update.execute({ ...lastAdminGuard, name: 'Admin', role: 'MANAGER' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      details: { reason: 'LAST_ADMIN' },
    });
    await expect(
      setStatus.execute({ ...lastAdminGuard, active: false }),
    ).rejects.toMatchObject({ details: { reason: 'LAST_ADMIN' } });
  });

  it('404 para usuário inexistente', async () => {
    await expect(
      setStatus.execute({ actorId: admin.id, id: 'nao-existe', active: false }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
