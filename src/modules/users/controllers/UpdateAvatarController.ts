import { Request, Response } from "express";
import { toUserResponse } from "../mappers/UserMapper";
import UpdateAvatarService from "../services/updateAvatarService";


export default class UsersAvatarController {
   public async update(request: Request, response: Response): Promise<Response>{
    const updateAvatar = new UpdateAvatarService();
    const user = await updateAvatar.execute({
      user_id: request.user.id,
      avatarFileName: request.file?.filename || '',
    });

    return response.json(toUserResponse(user));
    }
}
