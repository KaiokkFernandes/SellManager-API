import { Request, Response } from 'express';
import { AuthenticateUserService } from '../../../services/AuthenticateUserService';
import { SessionBody } from '@sellmanager/shared';
import { toUserResponse } from '../UserMapper';

export class SessionsController {
  constructor(
    private readonly authenticateUser: AuthenticateUserService,
    private readonly apiUrl: string,
  ) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const { user, token } = await this.authenticateUser.execute(
      request.body as SessionBody,
    );
    response.json({ user: toUserResponse(user, this.apiUrl), token });
  };
}
