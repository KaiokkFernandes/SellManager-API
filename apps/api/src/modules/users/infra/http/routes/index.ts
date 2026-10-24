import { RequestHandler, Router } from 'express';
import multer from 'multer';
import uploadConfig from '@config/upload';
import { Container } from '@shared/container';
import { authRateLimiter } from '@shared/http/middlewares/rateLimiter';
import { validate } from '@shared/http/middlewares/validate';
import { paginationQuerySchema } from '@sellmanager/shared';
import { AuthenticateUserService } from '../../../services/AuthenticateUserService';
import { CreateUserService } from '../../../services/CreateUserService';
import { ListUsersService } from '../../../services/ListUsersService';
import { ResetPasswordService } from '../../../services/ResetPasswordService';
import { SendForgotPasswordEmailService } from '../../../services/SendForgotPasswordEmailService';
import { ShowProfileService } from '../../../services/ShowProfileService';
import { UpdateProfileService } from '../../../services/UpdateProfileService';
import { UpdateUserAvatarService } from '../../../services/UpdateUserAvatarService';
import { PasswordController } from '../controllers/PasswordController';
import { ProfileController } from '../controllers/ProfileController';
import { SessionsController } from '../controllers/SessionsController';
import { UserAvatarController } from '../controllers/UserAvatarController';
import { UsersController } from '../controllers/UsersController';
import {
  createUserBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  sessionBodySchema,
  updateProfileBodySchema,
} from '@sellmanager/shared';

export function makeUsersRoutes(
  container: Container,
  authenticated: RequestHandler,
) {
  const { users, userTokens } = container.repositories;
  const { hash, token, mail, storage } = container.providers;
  const apiUrl = container.config.APP_API_URL;

  const usersController = new UsersController(
    new ListUsersService(users),
    new CreateUserService(users, hash),
    apiUrl,
  );
  const avatarController = new UserAvatarController(
    new UpdateUserAvatarService(users, storage),
    apiUrl,
  );
  const sessionsController = new SessionsController(
    new AuthenticateUserService(users, hash, token),
    apiUrl,
  );
  const profileController = new ProfileController(
    new ShowProfileService(users),
    new UpdateProfileService(users, hash),
    apiUrl,
  );
  const passwordController = new PasswordController(
    new SendForgotPasswordEmailService(
      users,
      userTokens,
      mail,
      container.config.APP_WEB_URL,
    ),
    new ResetPasswordService(users, userTokens, hash),
  );

  const upload = multer(uploadConfig.multer);

  const usersRouter = Router();
  usersRouter.get(
    '/',
    authenticated,
    validate({ query: paginationQuerySchema }),
    usersController.index,
  );
  usersRouter.post(
    '/',
    authRateLimiter,
    validate({ body: createUserBodySchema }),
    usersController.create,
  );
  usersRouter.patch(
    '/avatar',
    authenticated,
    upload.single('avatar'),
    avatarController.update,
  );

  const sessionsRouter = Router();
  sessionsRouter.post(
    '/',
    validate({ body: sessionBodySchema }),
    sessionsController.create,
  );

  const profileRouter = Router();
  profileRouter.use(authenticated);
  profileRouter.get('/', profileController.show);
  profileRouter.put(
    '/',
    validate({ body: updateProfileBodySchema }),
    profileController.update,
  );

  const passwordRouter = Router();
  passwordRouter.post(
    '/forgot',
    validate({ body: forgotPasswordBodySchema }),
    passwordController.forgot,
  );
  passwordRouter.post(
    '/reset',
    validate({ body: resetPasswordBodySchema }),
    passwordController.reset,
  );

  return { usersRouter, sessionsRouter, profileRouter, passwordRouter };
}
