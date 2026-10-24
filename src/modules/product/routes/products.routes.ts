import { Router } from 'express';
import ProductController from '../controller/ProductController';
import { idParamsSchema, validate } from '@shared/http/middlewares/validate';
import isAuthenticated from '@modules/users/middlewares/isAuthenticated';
import { productBodySchema } from './products.schemas';

const productRouter = Router();
const productsController = new ProductController();

productRouter.get('/', productsController.index.bind(productsController));

productRouter.get(
  '/:id',
  validate({ params: idParamsSchema }),
  productsController.show.bind(productsController),
);

productRouter.post(
  '/',
  isAuthenticated,
  validate({ body: productBodySchema }),
  productsController.create.bind(productsController),
);

productRouter.put(
  '/:id',
  isAuthenticated,
  validate({ params: idParamsSchema, body: productBodySchema }),
  productsController.update.bind(productsController),
);

productRouter.delete(
  '/:id',
  isAuthenticated,
  validate({ params: idParamsSchema }),
  productsController.delete.bind(productsController),
);

export default productRouter;
