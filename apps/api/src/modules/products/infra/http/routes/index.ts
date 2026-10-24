import { RequestHandler, Router } from 'express';
import { Container } from '@shared/container';
import { validate } from '@shared/http/middlewares/validate';
import { idParamsSchema, paginationQuerySchema } from '@sellmanager/shared';
import { CreateProductService } from '../../../services/CreateProductService';
import { DeleteProductService } from '../../../services/DeleteProductService';
import { ListProductsService } from '../../../services/ListProductsService';
import { ShowProductService } from '../../../services/ShowProductService';
import { UpdateProductService } from '../../../services/UpdateProductService';
import { ProductsController } from '../controllers/ProductsController';
import { productBodySchema } from '@sellmanager/shared';

export function makeProductsRoutes(
  container: Container,
  authenticated: RequestHandler,
): Router {
  const { products } = container.repositories;

  const controller = new ProductsController({
    list: new ListProductsService(products),
    show: new ShowProductService(products),
    create: new CreateProductService(products),
    update: new UpdateProductService(products),
    delete: new DeleteProductService(products),
  });

  const router = Router();

  router.get('/', validate({ query: paginationQuerySchema }), controller.index);
  router.get('/:id', validate({ params: idParamsSchema }), controller.show);
  router.post(
    '/',
    authenticated,
    validate({ body: productBodySchema }),
    controller.create,
  );
  router.put(
    '/:id',
    authenticated,
    validate({ params: idParamsSchema, body: productBodySchema }),
    controller.update,
  );
  router.delete(
    '/:id',
    authenticated,
    validate({ params: idParamsSchema }),
    controller.delete,
  );

  return router;
}
