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
import { ListLowStockProductsService } from '../../../services/ListLowStockProductsService';
import { ListStockMovementsService } from '../../../services/ListStockMovementsService';
import { RecordStockMovementService } from '../../../services/RecordStockMovementService';
import { ProductsController } from '../controllers/ProductsController';

export function registerProductsRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { products, orders, stockMovements, categories } =
    container.repositories;
  const { productsUnitOfWork } = container;
  const { storage } = container.providers;

  const controller = new ProductsController(
    {
      list: new ListProductsService(products),
      lowStock: new ListLowStockProductsService(products),
      show: new ShowProductService(products),
      create: new CreateProductService(productsUnitOfWork, categories),
      update: new UpdateProductService(products, categories),
      delete: new DeleteProductService(products, orders, storage),
      updateImage: new UpdateProductImageService(products, storage),
      listStockMovements: new ListStockMovementsService(
        products,
        stockMovements,
      ),
      recordStockMovement: new RecordStockMovementService(productsUnitOfWork),
    },
    container.config.APP_API_URL,
  );

  mount(routes.products.list, controller.list);
  // antes de /products/{id}: senão "low-stock" casaria como id
  mount(routes.products.lowStock, controller.lowStock);
  mount(routes.products.show, controller.show);
  mount(routes.products.create, controller.create);
  mount(routes.products.update, controller.update);
  mount(routes.products.delete, controller.delete);
  mount(routes.products.listStockMovements, controller.listStockMovements);
  mount(routes.products.createStockMovement, controller.createStockMovement);
  mount(
    routes.products.updateImage,
    controller.updateImage,
    multer(uploadConfig.multer).single('image'),
  );
  mount(routes.products.deleteImage, controller.deleteImage);
}
