import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { FakeUsersUnitOfWork } from '../fakes/FakeUsersUnitOfWork';
import { CreateFirstAdminService } from './CreateFirstAdminService';

const admin = {
  name: 'Ana',
  email: 'ana@loja.com',
  password: 'senha-forte-123',
};

describe('CreateFirstAdminService', () => {
  let users: FakeUsersRepository;
  let service: CreateFirstAdminService;

  beforeEach(() => {
    users = new FakeUsersRepository();
    service = new CreateFirstAdminService(
      new FakeUsersUnitOfWork(users),
      new FakeHashProvider(),
    );
  });

  it('cria o primeiro ADMIN com a senha em hash', async () => {
    const created = await service.execute(admin);

    expect(created).toMatchObject({ email: 'ana@loja.com', role: 'ADMIN' });
    expect(created?.password).not.toBe(admin.password);
  });

  it('com um ADMIN ativo não faz nada', async () => {
    await service.execute(admin);

    const second = await service.execute({ ...admin, email: 'bia@loja.com' });

    expect(second).toBeNull();
    expect(users.users).toHaveLength(1);
  });

  it('e-mail de outro usuário é recusado, sem promover a conta', async () => {
    await users.create({ ...admin, role: 'SELLER' });

    await expect(service.execute(admin)).rejects.toMatchObject({
      statusCode: 409,
      code: 'ALREADY_EXISTS',
    });
    expect(users.users[0]?.role).toBe('SELLER');
  });

  it('só com ADMIN desativado cria outro (recupera o acesso)', async () => {
    const old = await users.create({ ...admin, role: 'ADMIN' });
    await users.save({ ...old, active: false });

    const created = await service.execute({
      ...admin,
      email: 'nova@loja.com',
    });

    expect(created?.role).toBe('ADMIN');
  });
});
