import { beforeEach, describe, expect, it } from 'vitest';
import { FakeOrdersRepository } from '@modules/orders/fakes/FakeOrdersRepository';
import { FakeProductsRepository } from '../fakes/FakeProductsRepository';
import { CreateProductService } from './CreateProductService';
import { DeleteProductService } from './DeleteProductService';
import { ListProductsService } from './ListProductsService';
import { ShowProductService } from './ShowProductService';
import { UpdateProductService } from './UpdateProductService';

describe('Product services', () => {
  let repository: FakeProductsRepository;

  beforeEach(() => {
    repository = new FakeProductsRepository();
  });

  const keyboard = { name: 'Teclado', price: 199.9, quantity: 10 };

  it('cria e lista produtos', async () => {
    await new CreateProductService(repository).execute(keyboard);

    const { data: products, meta } = await new ListProductsService(
      repository,
    ).execute();
    expect(meta).toEqual({ page: 1, limit: 20, total: 1, total_pages: 1 });
    expect(products).toEqual([expect.objectContaining(keyboard)]);
  });

  it('não permite dois produtos com o mesmo nome', async () => {
    await new CreateProductService(repository).execute(keyboard);

    await expect(
      new CreateProductService(repository).execute(keyboard),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'ALREADY_EXISTS',
      issues: [{ segment: 'body', path: 'name' }],
    });
  });

  it('nome duplicado não diferencia maiúsculas', async () => {
    await new CreateProductService(repository).execute(keyboard);

    await expect(
      new CreateProductService(repository).execute({
        ...keyboard,
        name: keyboard.name.toUpperCase(),
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_EXISTS' });
  });

  it('mostra um produto e responde 404 quando não existe', async () => {
    const created = await new CreateProductService(repository).execute(
      keyboard,
    );
    const show = new ShowProductService(repository);

    expect((await show.execute({ id: created.id })).name).toBe('Teclado');
    await expect(show.execute({ id: 'nope' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('atualiza mantendo o próprio nome', async () => {
    const created = await new CreateProductService(repository).execute(
      keyboard,
    );

    const updated = await new UpdateProductService(repository).execute({
      id: created.id,
      ...keyboard,
      price: 150,
    });

    expect(updated.price).toBe(150);
  });

  it('não permite renomear para o nome de outro produto', async () => {
    const created = await new CreateProductService(repository).execute(
      keyboard,
    );
    await new CreateProductService(repository).execute({
      ...keyboard,
      name: 'Mouse',
    });

    await expect(
      new UpdateProductService(repository).execute({
        id: created.id,
        ...keyboard,
        name: 'Mouse',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('remove um produto', async () => {
    const created = await new CreateProductService(repository).execute(
      keyboard,
    );

    await new DeleteProductService(
      repository,
      new FakeOrdersRepository(),
    ).execute({ id: created.id });

    expect(repository.products).toHaveLength(0);
    await expect(
      new DeleteProductService(repository, new FakeOrdersRepository()).execute({
        id: created.id,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('não exclui produto que está em pedidos', async () => {
    const created = await new CreateProductService(repository).execute(
      keyboard,
    );
    const orders = new FakeOrdersRepository();
    for (const customer_id of ['c1', 'c2']) {
      await orders.create({
        customer_id,
        status: 'pending',
        total: 199.9,
        items: [{ product_id: created.id, price: 199.9, quantity: 1 }],
      });
    }

    await expect(
      new DeleteProductService(repository, orders).execute({ id: created.id }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'RESOURCE_IN_USE',
      details: { orders_count: 2 },
    });
    expect(repository.products).toHaveLength(1);
  });
});
