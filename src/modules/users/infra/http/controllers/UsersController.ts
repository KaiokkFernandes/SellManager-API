import { Request, Response } from 'express';
import {
  PaginationQuery,
  validatedQuery,
} from '@shared/http/middlewares/validate';
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
    request: Request,
    response: Response,
  ): Promise<void> => {
    const { data, meta } = await this.listUsers.execute(
      validatedQuery<PaginationQuery>(request),
    );
    response.json({
      data: data.map(user => toUserResponse(user, this.apiUrl)),
      meta,
    });
  };

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const user = await this.createUser.execute(request.body as CreateUserBody);
    response.status(201).json(toUserResponse(user, this.apiUrl));
  };
}
