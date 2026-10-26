import { routes } from '@sellmanager/shared';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { CreateProductService } from '../../../services/CreateProductService';
import { DeleteProductService } from '../../../services/DeleteProductService';
import { ListProductsService } from '../../../services/ListProductsService';
import { ShowProductService } from '../../../services/ShowProductService';
import { UpdateProductService } from '../../../services/UpdateProductService';
import { ProductsController } from '../controllers/ProductsController';

export function registerProductsRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { products } = container.repositories;

  const controller = new ProductsController({
    list: new ListProductsService(products),
    show: new ShowProductService(products),
    create: new CreateProductService(products),
    update: new UpdateProductService(products),
    delete: new DeleteProductService(products),
  });

  mount(routes.products.list, controller.list);
  mount(routes.products.show, controller.show);
  mount(routes.products.create, controller.create);
  mount(routes.products.update, controller.update);
  mount(routes.products.delete, controller.delete);
}
