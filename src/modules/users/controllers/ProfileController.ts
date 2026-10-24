import { Request, Response } from 'express';
import { toUserResponse } from '../mappers/UserMapper';
import UpdateProfileServices from '../services/UpdateProfileService';
import ShowProfileServices from '../services/ShowPerfil';

export default class ProfileController {
  public async show(request: Request, response: Response): Promise<Response> {
    const showUser = new ShowProfileServices();

    const user_id = request.user.id;

    const user = await showUser.execute({ user_id });
    return response.json(toUserResponse(user));
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { name, email, password, old_password } = request.body;

    const updateProfile = new UpdateProfileServices();

    const user = await updateProfile.execute({
      user_id: request.user.id,
      name,
      email,
      password,
      old_password,
    });

    return response.json(toUserResponse(user));
  }
}
