import { Router } from 'express';
import UsersController from '../controllers/UsersController';
import { validate } from '@shared/http/middlewares/validate';
import { createUserBodySchema } from './users.schemas';
import multer from 'multer';
import updateConfig from '@config/upload';
import isAuthenticated from '../middlewares/isAuthenticated';
import UsersAvatarController from '../controllers/UpdateAvatarController';

const UsersRouter = Router();
const usersController = new UsersController();
const useravatarController = new UsersAvatarController();

const upload = multer(updateConfig);
// Rota para listar todos os usuários
UsersRouter.get(
  '/',
  isAuthenticated,
  usersController.index.bind(usersController),
);

// Rota para criar usuarios
UsersRouter.post(
  '/',
  validate({ body: createUserBodySchema }),
  usersController.create.bind(usersController),
);

UsersRouter.patch(
  '/avatar',
  isAuthenticated,
  upload.single('avatar'),
  useravatarController.update.bind(useravatarController),
);

export default UsersRouter;
