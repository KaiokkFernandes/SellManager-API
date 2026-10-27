import uploadConfig from '@config/upload';
import { routes } from '@sellmanager/shared';
import multer from 'multer';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { CreateProductService } from '../../../services/CreateProductService';
import { DeleteProductService } from '../../../services/DeleteProductService';
import { ListProductsService } from '../../../services/ListProductsService';
import { ShowProductService } from '../../../services/ShowProductService';
import { UpdateProductImageService } from '../../../services/UpdateProductImageService';
import { UpdateProductService } from '../../../services/UpdateProductService';
import { ProductsController } from '../controllers/ProductsController';

export function registerProductsRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { products, orders } = container.repositories;
  const { storage } = container.providers;

  const controller = new ProductsController(
    {
      list: new ListProductsService(products),
      show: new ShowProductService(products),
      create: new CreateProductService(products),
      update: new UpdateProductService(products),
      delete: new DeleteProductService(products, orders, storage),
      updateImage: new UpdateProductImageService(products, storage),
    },
    container.config.APP_API_URL,
  );

  mount(routes.products.list, controller.list);
  mount(routes.products.show, controller.show);
  mount(routes.products.create, controller.create);
  mount(routes.products.update, controller.update);
  mount(routes.products.delete, controller.delete);
  mount(
    routes.products.updateImage,
    controller.updateImage,
    multer(uploadConfig.multer).single('image'),
  );
  mount(routes.products.deleteImage, controller.deleteImage);
}
