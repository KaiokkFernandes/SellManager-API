import { Request, Response } from 'express';
import { CreateUserService } from '../../../services/CreateUserService';
import { ListUsersService } from '../../../services/ListUsersService';
import { CreateUserBody } from '../schemas';
import { toUserResponse } from '../UserMapper';

export class UsersController {
  constructor(
    private readonly listUsers: ListUsersService,
    private readonly createUser: CreateUserService,
    private readonly apiUrl: string,
  ) {}

  public index = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    const users = await this.listUsers.execute();
    response.json(users.map(user => toUserResponse(user, this.apiUrl)));
  };

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const user = await this.createUser.execute(request.body as CreateUserBody);
    response.status(201).json(toUserResponse(user, this.apiUrl));
  };
}
