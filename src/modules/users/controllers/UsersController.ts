import { Request, Response } from 'express';
import { CreateUserBody } from '../routes/users.schemas';
import { toUserResponse } from '../mappers/UserMapper';
import ListUsersServices from '../services/listUserService';
import CreateUserService from '../services/CreateUserService';

export default class UsersController {
  public async index(_request: Request, response: Response): Promise<Response> {
    const ListUsers = new ListUsersServices();

    const users = await ListUsers.execute();

    return response.json(users.map(toUserResponse));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, email, password } = request.body as CreateUserBody;

    const createUser = new CreateUserService();

    const user = await createUser.execute({
      name,
      email,
      password,
    });

    return response.status(201).json(toUserResponse(user));
  }
}
