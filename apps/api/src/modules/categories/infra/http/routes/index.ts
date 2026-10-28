import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { CreateCategoryService } from '../../../services/CreateCategoryService';
import { DeleteCategoryService } from '../../../services/DeleteCategoryService';
import { ListCategoriesService } from '../../../services/ListCategoriesService';
import { UpdateCategoryService } from '../../../services/UpdateCategoryService';
import { CategoriesController } from '../controllers/CategoriesController';

export function registerCategoriesRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { categories } = container.repositories;

  const controller = new CategoriesController({
    list: new ListCategoriesService(categories),
    create: new CreateCategoryService(categories),
    update: new UpdateCategoryService(categories),
    delete: new DeleteCategoryService(categories),
  });

  mount(routes.categories.list, controller.list);
  mount(routes.categories.create, controller.create);
  mount(routes.categories.update, controller.update);
  mount(routes.categories.delete, controller.delete);
}
