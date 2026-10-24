import { Request, Response } from 'express';
import { SessionBody } from '../routes/users.schemas';
import { toUserResponse } from '../mappers/UserMapper';
import AuthenticationUserService from '../services/AuthenticationUserService';

export default class AuthenticationSessionController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body as SessionBody;

    const createSession = new AuthenticationUserService();

    const { user, token } = await createSession.execute({
      email,
      password,
    });

    return response.json({ user: toUserResponse(user), token });
  }
}
