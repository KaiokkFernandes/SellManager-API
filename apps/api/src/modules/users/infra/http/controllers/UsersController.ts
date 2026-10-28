import type { routes } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { AuthenticateUserService } from '../../../services/AuthenticateUserService';
import { CreateUserService } from '../../../services/CreateUserService';
import { ListUsersService } from '../../../services/ListUsersService';
import { ResetPasswordService } from '../../../services/ResetPasswordService';
import { SendForgotPasswordEmailService } from '../../../services/SendForgotPasswordEmailService';
import { ShowProfileService } from '../../../services/ShowProfileService';
import { UpdateProfileService } from '../../../services/UpdateProfileService';
import { UpdateUserAvatarService } from '../../../services/UpdateUserAvatarService';
import { toUserResponse } from '../UserMapper';

interface UsersServices {
  list: ListUsersService;
  create: CreateUserService;
  updateAvatar: UpdateUserAvatarService;
  authenticate: AuthenticateUserService;
  showProfile: ShowProfileService;
  updateProfile: UpdateProfileService;
  sendForgotPasswordEmail: SendForgotPasswordEmailService;
  resetPassword: ResetPasswordService;
}

type Routes = typeof routes;

export class UsersController {
  constructor(
    private readonly services: UsersServices,
    private readonly apiUrl: string,
  ) {}

  private toResponse = (user: Parameters<typeof toUserResponse>[0]) =>
    toUserResponse(user, this.apiUrl);

  public create: RouteHandler<Routes['users']['create']> = async ({
    input,
    reply,
  }) => {
    // provisório: o cadastro deixa de ser público quando o CRUD de usuários entrar
    const user = await this.services.create.execute({
      ...input.body,
      role: 'SELLER',
    });
    reply(201, this.toResponse(user));
  };

  public list: RouteHandler<Routes['users']['list']> = async ({
    input,
    reply,
  }) => {
    const { data, meta } = await this.services.list.execute(input.query);
    reply(200, { data: data.map(this.toResponse), meta });
  };

  public updateAvatar: RouteHandler<Routes['users']['updateAvatar']> = async ({
    request,
    reply,
  }) => {
    if (!request.file) {
      throw new AppError('Avatar file is required', 400, {
        code: 'INVALID_UPLOAD',
      });
    }

    const user = await this.services.updateAvatar.execute({
      user_id: request.user.id,
      avatarFileName: request.file.filename,
    });
    reply(200, this.toResponse(user));
  };

  public createSession: RouteHandler<Routes['sessions']['create']> = async ({
    input,
    reply,
  }) => {
    const { user, token } = await this.services.authenticate.execute(
      input.body,
    );
    reply(200, { user: this.toResponse(user), token });
  };

  public showProfile: RouteHandler<Routes['profile']['show']> = async ({
    request,
    reply,
  }) => {
    const user = await this.services.showProfile.execute({
      user_id: request.user.id,
    });
    reply(200, this.toResponse(user));
  };

  public updateProfile: RouteHandler<Routes['profile']['update']> = async ({
    input,
    request,
    reply,
  }) => {
    const { name, email, password: newPassword, old_password } = input.body;
    const user = await this.services.updateProfile.execute({
      user_id: request.user.id,
      name,
      email,
      password: newPassword,
      old_password,
    });
    reply(200, this.toResponse(user));
  };

  public forgotPassword: RouteHandler<Routes['password']['forgot']> = async ({
    input,
    reply,
  }) => {
    await this.services.sendForgotPasswordEmail.execute(input.body);
    reply(204);
  };

  public resetPassword: RouteHandler<Routes['password']['reset']> = async ({
    input,
    reply,
  }) => {
    const { token, password: newPassword } = input.body;
    await this.services.resetPassword.execute({ token, password: newPassword });
    reply(204);
  };
}
