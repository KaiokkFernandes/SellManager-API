import { beforeEach, describe, expect, it } from 'vitest';
import { FakeCustomersRepository } from '../fakes/FakeCustomersRepository';
import { CreateCustomerService } from './CreateCustomerService';
import { DeleteCustomerService } from './DeleteCustomerService';
import { ListCustomersService } from './ListCustomersService';
import { ShowCustomerService } from './ShowCustomerService';
import { UpdateCustomerService } from './UpdateCustomerService';

describe('Customer services', () => {
  let repository: FakeCustomersRepository;
  const ana = { name: 'Ana', email: 'ana@test.com' };

  beforeEach(() => {
    repository = new FakeCustomersRepository();
  });

  it('cria e lista clientes', async () => {
    await new CreateCustomerService(repository).execute(ana);

    expect((await new ListCustomersService(repository).execute()).data).toEqual(
      [expect.objectContaining(ana)],
    );
  });

  it('não permite e-mail duplicado', async () => {
    await new CreateCustomerService(repository).execute(ana);

    await expect(
      new CreateCustomerService(repository).execute(ana),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('responde 404 para cliente inexistente', async () => {
    await expect(
      new ShowCustomerService(repository).execute({ id: 'nope' }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  // Regressão: antes comparava o e-mail com o id e sempre falhava.
  it('atualiza mantendo o próprio e-mail', async () => {
    const customer = await new CreateCustomerService(repository).execute(ana);

    const updated = await new UpdateCustomerService(repository).execute({
      id: customer.id,
      name: 'Ana Maria',
      email: ana.email,
    });

    expect(updated.name).toBe('Ana Maria');
  });

  it('não permite usar o e-mail de outro cliente', async () => {
    const customer = await new CreateCustomerService(repository).execute(ana);
    await new CreateCustomerService(repository).execute({
      name: 'Bia',
      email: 'bia@test.com',
    });

    await expect(
      new UpdateCustomerService(repository).execute({
        id: customer.id,
        name: 'Ana',
        email: 'bia@test.com',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('remove um cliente', async () => {
    const customer = await new CreateCustomerService(repository).execute(ana);

    await new DeleteCustomerService(repository).execute({ id: customer.id });

    expect(repository.customers).toHaveLength(0);
  });
});
