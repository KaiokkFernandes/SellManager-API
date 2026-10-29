import { beforeEach, describe, expect, it } from 'vitest';
import { FakeCategoriesRepository } from '../fakes/FakeCategoriesRepository';
import { CreateCategoryService } from './CreateCategoryService';
import { DeleteCategoryService } from './DeleteCategoryService';
import { ListCategoriesService } from './ListCategoriesService';
import { UpdateCategoryService } from './UpdateCategoryService';

describe('Category services', () => {
  let categories: FakeCategoriesRepository;
  const productsIn = new Map<string, number>();

  beforeEach(() => {
    productsIn.clear();
    categories = new FakeCategoriesRepository(id => productsIn.get(id) ?? 0);
  });

  const create = (name: string) =>
    new CreateCategoryService(categories).execute({ name });

  it('cria, lista por nome com busca e conta os produtos', async () => {
    const cables = await create('Cabos');
    await create('acessórios');
    await create('Periféricos');
    productsIn.set(cables.id, 3);

    const { data } = await new ListCategoriesService(categories).execute();
    expect(data.map(category => category.name)).toEqual([
      'acessórios',
      'Cabos',
      'Periféricos',
    ]);
    expect(data[1]?.products_count).toBe(3);

    const found = await new ListCategoriesService(categories).execute({
      search: 'CAB',
    });
    expect(found.meta.total).toBe(1);
  });

  it('nome único sem diferenciar maiúsculas (criar e renomear)', async () => {
    const cables = await create('Cabos');
    await create('Mouses');

    await expect(create('cabos')).rejects.toMatchObject({
      statusCode: 409,
      code: 'ALREADY_EXISTS',
      issues: [{ path: 'name' }],
    });
    const update = new UpdateCategoryService(categories);
    await expect(
      update.execute({ id: cables.id, name: 'MOUSES' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect((await update.execute({ id: cables.id, name: 'CABOS' })).name).toBe(
      'CABOS',
    );
    await expect(
      update.execute({ id: 'nope', name: 'X' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('não exclui categoria com produtos (409 RESOURCE_IN_USE)', async () => {
    const cables = await create('Cabos');
    productsIn.set(cables.id, 2);
    const remove = new DeleteCategoryService(categories);

    await expect(remove.execute({ id: cables.id })).rejects.toMatchObject({
      statusCode: 409,
      code: 'RESOURCE_IN_USE',
      details: { products_count: 2 },
    });

    productsIn.set(cables.id, 0);
    await remove.execute({ id: cables.id });
    expect(categories.categories).toHaveLength(0);
    await expect(remove.execute({ id: cables.id })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
