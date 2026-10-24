import { Request, Response } from 'express';
import AppError from '@shared/errors/AppError';
import { UpdateUserAvatarService } from '../../../services/UpdateUserAvatarService';
import { toUserResponse } from '../UserMapper';

export class UserAvatarController {
  constructor(
    private readonly updateUserAvatar: UpdateUserAvatarService,
    private readonly apiUrl: string,
  ) {}

  public update = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.file) {
      throw new AppError('Avatar file is required');
    }

    const user = await this.updateUserAvatar.execute({
      user_id: request.user.id,
      avatarFileName: request.file.filename,
    });

    response.json(toUserResponse(user, this.apiUrl));
  };
}
