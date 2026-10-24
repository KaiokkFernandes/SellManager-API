import { Router } from 'express';
import UsersController from '../controllers/UsersController';
import asyncHandler from '@config/Middleware';
import { celebrate, Joi } from 'celebrate';
import multer from 'multer';
import updateConfig from '@config/upload';
import isAuthenticated from '../middlewares/isAuthenticated';
import UsersAvatarController from '../controllers/UpdateAvatarController';

const UsersRouter = Router();
const usersController = new UsersController();
const useravatarController = new UsersAvatarController();

const upload = multer(updateConfig);
// Rota para listar todos os usuários
UsersRouter.get('/', isAuthenticated, asyncHandler(usersController.index.bind(usersController)));

// Rota para criar usuarios
UsersRouter.post('/',
  celebrate({
    body: {
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }
  }),
  asyncHandler(usersController.create));

UsersRouter.patch(
  '/avatar',
  isAuthenticated,
  upload.single('avatar'),
  asyncHandler(useravatarController.update.bind(useravatarController))
)

export default UsersRouter;
