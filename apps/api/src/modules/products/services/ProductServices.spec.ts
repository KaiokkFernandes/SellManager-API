import { beforeEach, describe, expect, it } from 'vitest';
import { FakeOrdersRepository } from '@modules/orders/fakes/FakeOrdersRepository';
import { FakeStorageProvider } from '@shared/providers/StorageProvider/FakeStorageProvider';
import { FakeProductsRepository } from '../fakes/FakeProductsRepository';
import { UpdateProductImageService } from './UpdateProductImageService';
import { CreateProductService } from './CreateProductService';
import { DeleteProductService } from './DeleteProductService';
import { ListProductsService } from './ListProductsService';
import { ShowProductService } from './ShowProductService';
import { UpdateProductService } from './UpdateProductService';

describe('Product services', () => {
  let repository: FakeProductsRepository;
  let storage: FakeStorageProvider;

  beforeEach(() => {
    repository = new FakeProductsRepository();
    storage = new FakeStorageProvider();
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

  it('lista com busca e ordenação', async () => {
    for (const [name, price] of [
      ['Cabo', 10],
      ['Mouse', 50],
      ['cabo longo', 30],
    ] as const) {
      await new CreateProductService(repository).execute({
        name,
        price,
        quantity: 1,
      });
    }

    const { data, meta } = await new ListProductsService(repository).execute({
      search: 'CABO',
      sort: 'price',
      order: 'desc',
    });

    expect(data.map(product => product.name)).toEqual(['cabo longo', 'Cabo']);
    expect(meta.total).toBe(2);
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
      storage,
    ).execute({ id: created.id });

    expect(repository.products).toHaveLength(0);
    await expect(
      new DeleteProductService(
        repository,
        new FakeOrdersRepository(),
        storage,
      ).execute({
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
        customer: { id: customer_id, name: 'Ana', email: 'ana@test.com' },
        status: 'pending',
        total: 199.9,
        items: [
          {
            product_id: created.id,
            product: { id: created.id, name: created.name },
            price: 199.9,
            quantity: 1,
          },
        ],
      });
    }

    await expect(
      new DeleteProductService(repository, orders, storage).execute({
        id: created.id,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'RESOURCE_IN_USE',
      details: { orders_count: 2 },
    });
    expect(repository.products).toHaveLength(1);
  });

  describe('imagem', () => {
    it('envia, substitui (apagando a anterior) e remove', async () => {
      const created = await new CreateProductService(repository).execute(
        keyboard,
      );
      const service = new UpdateProductImageService(repository, storage);

      await service.execute({ id: created.id, imageFileName: 'a.png' });
      const replaced = await service.execute({
        id: created.id,
        imageFileName: 'b.webp',
      });
      expect(replaced.image).toBe('b.webp');
      expect([...storage.files]).toEqual(['b.webp']);

      const removed = await service.execute({
        id: created.id,
        imageFileName: null,
      });
      expect(removed.image).toBeNull();
      expect(storage.files.size).toBe(0);
    });

    it('produto inexistente: 404 e descarta o upload temporário', async () => {
      await expect(
        new UpdateProductImageService(repository, storage).execute({
          id: 'nao-existe',
          imageFileName: 'a.png',
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect([...storage.discarded]).toEqual(['a.png']);
    });

    it('excluir o produto apaga a imagem', async () => {
      const created = await new CreateProductService(repository).execute(
        keyboard,
      );
      await new UpdateProductImageService(repository, storage).execute({
        id: created.id,
        imageFileName: 'a.png',
      });

      await new DeleteProductService(
        repository,
        new FakeOrdersRepository(),
        storage,
      ).execute({ id: created.id });

      expect(storage.files.size).toBe(0);
    });
  });
});
