import { Router } from 'express';
import ProductController from '../controller/ProductController';
import asyncHandler from '@config/Middleware';
import { idParamsSchema, validate } from '@shared/http/middlewares/validate';
import isAuthenticated from '@modules/users/middlewares/isAuthenticated';
import { productBodySchema } from './products.schemas';

const productRouter = Router();
const productsController = new ProductController();

productRouter.get(
  '/',
  asyncHandler(productsController.index.bind(productsController)),
);

productRouter.get(
  '/:id',
  validate({ params: idParamsSchema }),
  asyncHandler(productsController.show.bind(productsController)),
);

productRouter.post(
  '/',
  isAuthenticated,
  validate({ body: productBodySchema }),
  asyncHandler(productsController.create.bind(productsController)),
);

productRouter.put(
  '/:id',
  isAuthenticated,
  validate({ params: idParamsSchema, body: productBodySchema }),
  asyncHandler(productsController.update.bind(productsController)),
);

productRouter.delete(
  '/:id',
  isAuthenticated,
  validate({ params: idParamsSchema }),
  asyncHandler(productsController.delete.bind(productsController)),
);

export default productRouter;
