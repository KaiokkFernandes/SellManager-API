import type { routes } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { AuthenticateUserService } from '../../../services/AuthenticateUserService';
import { ChangePasswordService } from '../../../services/ChangePasswordService';
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
import { toUserResponse } from '../UserMapper';

interface UsersServices {
  list: ListUsersService;
  show: ShowUserService;
  create: CreateUserService;
  update: UpdateUserService;
  updateStatus: UpdateUserStatusService;
  updateAvatar: UpdateUserAvatarService;
  authenticate: AuthenticateUserService;
  showProfile: ShowProfileService;
  updateProfile: UpdateProfileService;
  changePassword: ChangePasswordService;
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
    const user = await this.services.create.execute(input.body);
    reply(201, this.toResponse(user));
  };

  public show: RouteHandler<Routes['users']['show']> = async ({
    input,
    reply,
  }) => {
    const user = await this.services.show.execute({ id: input.params.id });
    reply(200, this.toResponse(user));
  };

  public update: RouteHandler<Routes['users']['update']> = async ({
    input,
    request,
    reply,
  }) => {
    const user = await this.services.update.execute({
      actorId: request.user.id,
      id: input.params.id,
      ...input.body,
    });
    reply(200, this.toResponse(user));
  };

  public updateStatus: RouteHandler<Routes['users']['updateStatus']> = async ({
    input,
    request,
    reply,
  }) => {
    const user = await this.services.updateStatus.execute({
      actorId: request.user.id,
      id: input.params.id,
      active: input.body.active,
    });
    reply(200, this.toResponse(user));
  };

  public list: RouteHandler<Routes['users']['list']> = async ({
    input,
    reply,
  }) => {
    const { page, limit, q, role, status } = input.query;
    const { data, meta } = await this.services.list.execute(
      {
        search: q,
        role,
        active: status === undefined ? undefined : status === 'active',
      },
      { page, limit },
    );
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
    const user = await this.services.updateProfile.execute({
      user_id: request.user.id,
      name: input.body.name,
    });
    reply(200, this.toResponse(user));
  };

  public changePassword: RouteHandler<Routes['profile']['changePassword']> =
    async ({ input, request, reply }) => {
      const { user, token } = await this.services.changePassword.execute({
        user_id: request.user.id,
        current_password: input.body.current_password,
        password: input.body.password,
      });
      reply(200, { user: this.toResponse(user), token });
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
