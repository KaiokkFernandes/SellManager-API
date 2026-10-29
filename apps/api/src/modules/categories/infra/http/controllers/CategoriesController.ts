import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { CreateCategoryService } from '../../../services/CreateCategoryService';
import { DeleteCategoryService } from '../../../services/DeleteCategoryService';
import { ListCategoriesService } from '../../../services/ListCategoriesService';
import { UpdateCategoryService } from '../../../services/UpdateCategoryService';
import { toCategoryResponse } from '../CategoryMapper';

interface CategoriesServices {
  list: ListCategoriesService;
  create: CreateCategoryService;
  update: UpdateCategoryService;
  delete: DeleteCategoryService;
}

type Routes = typeof routes.categories;

export class CategoriesController {
  constructor(private readonly services: CategoriesServices) {}

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { page, limit, q } = input.query;
    const { data, meta } = await this.services.list.execute(
      { search: q },
      { page, limit },
    );
    reply(200, { data: data.map(toCategoryResponse), meta });
  };

  public create: RouteHandler<Routes['create']> = async ({ input, reply }) => {
    const category = await this.services.create.execute(input.body);
    reply(201, toCategoryResponse(category));
  };

  public update: RouteHandler<Routes['update']> = async ({ input, reply }) => {
    const category = await this.services.update.execute({
      id: input.params.id,
      ...input.body,
    });
    reply(200, toCategoryResponse(category));
  };

  public delete: RouteHandler<Routes['delete']> = async ({ input, reply }) => {
    await this.services.delete.execute({ id: input.params.id });
    reply(204);
  };
}
