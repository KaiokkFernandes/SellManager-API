import { Request, Response } from 'express';
import { toUserResponse } from '../mappers/UserMapper';
import UpdateAvatarService from '../services/updateAvatarService';

export default class UsersAvatarController {
  public async update(request: Request, response: Response): Promise<void> {
    const updateAvatar = new UpdateAvatarService();
    const user = await updateAvatar.execute({
      user_id: request.user.id,
      avatarFileName: request.file?.filename || '',
    });

    response.json(toUserResponse(user));
  }
}
