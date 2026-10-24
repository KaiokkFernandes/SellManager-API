import { Request, Response } from 'express';
import { ShowProfileService } from '../../../services/ShowProfileService';
import { UpdateProfileService } from '../../../services/UpdateProfileService';
import { UpdateProfileBody } from '../schemas';
import { toUserResponse } from '../UserMapper';

export class ProfileController {
  constructor(
    private readonly showProfile: ShowProfileService,
    private readonly updateProfile: UpdateProfileService,
    private readonly apiUrl: string,
  ) {}

  public show = async (request: Request, response: Response): Promise<void> => {
    const user = await this.showProfile.execute({ user_id: request.user.id });
    response.json(toUserResponse(user, this.apiUrl));
  };

  public update = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const { name, email, password, old_password } =
      request.body as UpdateProfileBody;

    const user = await this.updateProfile.execute({
      user_id: request.user.id,
      name,
      email,
      password,
      old_password,
    });

    response.json(toUserResponse(user, this.apiUrl));
  };
}
