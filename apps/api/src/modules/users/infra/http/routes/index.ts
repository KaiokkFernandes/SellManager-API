import multer from 'multer';
import { routes } from '@sellmanager/shared';
import uploadConfig from '@config/upload';
import { Container } from '@shared/container';
import type { MountRoute } from '@shared/http/contract/mountRoute';
import { AuthenticateUserService } from '../../../services/AuthenticateUserService';
import { CreateUserService } from '../../../services/CreateUserService';
import { ListUsersService } from '../../../services/ListUsersService';
import { ResetPasswordService } from '../../../services/ResetPasswordService';
import { SendForgotPasswordEmailService } from '../../../services/SendForgotPasswordEmailService';
import { ShowProfileService } from '../../../services/ShowProfileService';
import { UpdateProfileService } from '../../../services/UpdateProfileService';
import { ShowUserService } from '../../../services/ShowUserService';
import { UpdateUserAvatarService } from '../../../services/UpdateUserAvatarService';
import { UpdateUserService } from '../../../services/UpdateUserService';
import { UpdateUserStatusService } from '../../../services/UpdateUserStatusService';
import { UsersController } from '../controllers/UsersController';

export function registerUsersRoutes(
  mount: MountRoute,
  container: Container,
): void {
  const { users, userTokens } = container.repositories;
  const { hash, token, mail, storage } = container.providers;

  const controller = new UsersController(
    {
      list: new ListUsersService(users),
      show: new ShowUserService(users),
      create: new CreateUserService(users, hash),
      update: new UpdateUserService(container.usersUnitOfWork),
      updateStatus: new UpdateUserStatusService(container.usersUnitOfWork),
      updateAvatar: new UpdateUserAvatarService(users, storage),
      authenticate: new AuthenticateUserService(users, hash, token),
      showProfile: new ShowProfileService(users),
      updateProfile: new UpdateProfileService(users, hash),
      sendForgotPasswordEmail: new SendForgotPasswordEmailService(
        users,
        userTokens,
        mail,
        container.config.APP_WEB_URL,
      ),
      resetPassword: new ResetPasswordService(users, userTokens, hash),
    },
    container.config.APP_API_URL,
  );

  const upload = multer(uploadConfig.multer);

  mount(routes.users.create, controller.create);
  mount(routes.users.list, controller.list);
  mount(routes.users.show, controller.show);
  mount(routes.users.update, controller.update);
  mount(routes.users.updateStatus, controller.updateStatus);
  mount(
    routes.users.updateAvatar,
    controller.updateAvatar,
    upload.single('avatar'),
  );
  mount(routes.sessions.create, controller.createSession);
  mount(routes.profile.show, controller.showProfile);
  mount(routes.profile.update, controller.updateProfile);
  mount(routes.password.forgot, controller.forgotPassword);
  mount(routes.password.reset, controller.resetPassword);
}
