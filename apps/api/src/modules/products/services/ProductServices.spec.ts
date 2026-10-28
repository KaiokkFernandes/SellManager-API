import { beforeEach, describe, expect, it } from 'vitest';
import { FakeCategoriesRepository } from '@modules/categories/fakes/FakeCategoriesRepository';
import { FakeOrdersRepository } from '@modules/orders/fakes/FakeOrdersRepository';
import { FakeStorageProvider } from '@shared/providers/StorageProvider/FakeStorageProvider';
import { FakeProductsRepository } from '../fakes/FakeProductsRepository';
import { FakeProductsUnitOfWork } from '../fakes/FakeProductsUnitOfWork';
import { FakeStockMovementsRepository } from '../fakes/FakeStockMovementsRepository';
import { UpdateProductImageService } from './UpdateProductImageService';
import { CreateProductService } from './CreateProductService';
import { DeleteProductService } from './DeleteProductService';
import { ListProductsService } from './ListProductsService';
import { ShowProductService } from './ShowProductService';
import { UpdateProductService } from './UpdateProductService';

describe('Product services', () => {
  let repository: FakeProductsRepository;
  let storage: FakeStorageProvider;
  let movements: FakeStockMovementsRepository;
  let categories: FakeCategoriesRepository;
  let createProduct: (data: {
    name: string;
    price: number;
    quantity: number;
    category_id?: string | null;
  }) => ReturnType<CreateProductService['execute']>;
  const update = (data: Parameters<UpdateProductService['execute']>[0]) =>
    new UpdateProductService(repository, categories).execute(data);

  beforeEach(() => {
    categories = new FakeCategoriesRepository(
      id => repository.products.filter(p => p.category_id === id).length,
    );
    repository = new FakeProductsRepository(
      id => categories.categories.find(c => c.id === id)?.name ?? '',
    );
    storage = new FakeStorageProvider();
    movements = new FakeStockMovementsRepository();
    const service = new CreateProductService(
      new FakeProductsUnitOfWork(repository, movements),
      categories,
    );
    createProduct = data => service.execute({ ...data, created_by: 'admin-1' });
  });

  const keyboard = { name: 'Teclado', price: 199.9, quantity: 10 };

  it('cria e lista produtos', async () => {
    await createProduct(keyboard);

    const { data: products, meta } = await new ListProductsService(
      repository,
    ).execute();
    expect(meta).toEqual({ page: 1, limit: 20, total: 1, total_pages: 1 });
    expect(products).toEqual([expect.objectContaining(keyboard)]);
  });

  it('o estoque inicial vira a movimentação INITIAL (sem estoque, nenhuma)', async () => {
    const created = await createProduct(keyboard);
    const empty = await createProduct({
      ...keyboard,
      name: 'Vazio',
      quantity: 0,
    });

    expect(created.quantity).toBe(10);
    expect(movements.movements).toEqual([
      expect.objectContaining({
        product_id: created.id,
        type: 'INITIAL',
        quantity: 10,
        balance_after: 10,
        created_by: expect.objectContaining({ id: 'admin-1' }),
      }),
    ]);
    expect(movements.sumFor(empty.id)).toBe(0);
  });

  it('editar não mexe no estoque', async () => {
    const created = await createProduct(keyboard);

    const updated = await update({
      id: created.id,
      name: 'Teclado sem fio',
      price: 210,
    });

    expect(updated.quantity).toBe(10);
    expect(movements.movements).toHaveLength(1);
  });

  it('categoria: precisa existir, aparece no produto e filtra a lista', async () => {
    const peripherals = await categories.create({ name: 'Periféricos' });
    const mouse = await createProduct({
      ...keyboard,
      name: 'Mouse',
      category_id: peripherals.id,
    });
    await createProduct(keyboard);

    expect(mouse.category).toEqual({ id: peripherals.id, name: 'Periféricos' });
    const { data } = await new ListProductsService(repository).execute({
      category_id: peripherals.id,
    });
    expect(data.map(product => product.name)).toEqual(['Mouse']);

    await expect(
      createProduct({ ...keyboard, name: 'Cabo', category_id: 'nope' }),
    ).rejects.toMatchObject({ statusCode: 404, message: 'Category not found' });
    await expect(
      update({ id: mouse.id, name: 'Mouse', price: 1, category_id: 'nope' }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const moved = await update({
      id: mouse.id,
      name: 'Mouse',
      price: 1,
      category_id: null,
    });
    expect(moved.category).toBeNull();
  });

  it('lista com busca e ordenação', async () => {
    for (const [name, price] of [
      ['Cabo', 10],
      ['Mouse', 50],
      ['cabo longo', 30],
    ] as const) {
      await createProduct({
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
    await createProduct(keyboard);

    await expect(createProduct(keyboard)).rejects.toMatchObject({
      statusCode: 409,
      code: 'ALREADY_EXISTS',
      issues: [{ segment: 'body', path: 'name' }],
    });
  });

  it('nome duplicado não diferencia maiúsculas', async () => {
    await createProduct(keyboard);

    await expect(
      createProduct({
        ...keyboard,
        name: keyboard.name.toUpperCase(),
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_EXISTS' });
  });

  it('mostra um produto e responde 404 quando não existe', async () => {
    const created = await createProduct(keyboard);
    const show = new ShowProductService(repository);

    expect((await show.execute({ id: created.id })).name).toBe('Teclado');
    await expect(show.execute({ id: 'nope' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('atualiza mantendo o próprio nome', async () => {
    const created = await createProduct(keyboard);

    const updated = await update({
      id: created.id,
      name: keyboard.name,
      price: 150,
    });

    expect(updated.price).toBe(150);
  });

  it('não permite renomear para o nome de outro produto', async () => {
    const created = await createProduct(keyboard);
    await createProduct({
      ...keyboard,
      name: 'Mouse',
    });

    await expect(
      update({
        id: created.id,
        name: 'Mouse',
        price: keyboard.price,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('remove um produto', async () => {
    const created = await createProduct(keyboard);

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
    const created = await createProduct(keyboard);
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
      const created = await createProduct(keyboard);
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
      const created = await createProduct(keyboard);
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
