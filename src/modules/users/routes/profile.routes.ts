import { Router } from 'express';
import asyncHandler from '@config/Middleware';
import { celebrate, Joi } from 'celebrate';
import isAuthenticated from '../middlewares/isAuthenticated';
import ProfileController from '../controllers/ProfileController';

const profileRoutes = Router();
const profileController = new ProfileController();

profileRoutes.use(isAuthenticated);

profileRoutes.get(
  '/',
  asyncHandler(profileController.show.bind(profileController)),
);

// Rota para criar usuarios
profileRoutes.post(
  '/',
  celebrate({
    body: {
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      old_password: Joi.string(),
      password: Joi.string().optional(),
      password_confirmation: Joi.string()
        .optional()
        .valid(Joi.ref('password'))
        .when('password', {
          is: Joi.exist(),
          then: Joi.required(),
        }),
    },
  }),
  asyncHandler(profileController.update.bind(profileController)),
);

export default profileRoutes;
