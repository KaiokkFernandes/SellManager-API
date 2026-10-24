import { Router } from 'express';
import ProductController from '../controller/ProductController';
import asyncHandler from '@config/Middleware';
import { celebrate, Joi, Segments } from 'celebrate';
import isAuthenticated from '@modules/users/middlewares/isAuthenticated';

const productRouter = Router();
const productsController = new ProductController();

productRouter.get(
  '/',
  asyncHandler(productsController.index.bind(productsController)),
);

productRouter.get(
  '/:id',
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().uuid().required(),
    },
  }),
  asyncHandler(productsController.show.bind(productsController)),
);

productRouter.post(
  '/',
  isAuthenticated,
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      price: Joi.number().precision(2).min(0).required(),
      quantity: Joi.number().integer().min(0).required(),
    },
  }),
  asyncHandler(productsController.create.bind(productsController)),
);

productRouter.put(
  '/:id',
  isAuthenticated,
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      price: Joi.number().precision(2).min(0).required(),
      quantity: Joi.number().integer().min(0).required(),
    },
    [Segments.PARAMS]: {
      id: Joi.string().uuid().required(),
    },
  }),
  asyncHandler(productsController.update.bind(productsController)),
);

productRouter.delete(
  '/:id',
  isAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().uuid().required(),
    },
  }),
  asyncHandler(productsController.delete.bind(productsController)),
);

export default productRouter;
