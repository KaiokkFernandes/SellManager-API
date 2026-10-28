import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { Role, User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export class CreateUserService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly hashProvider: IHashProvider,
  ) {}

  public async execute({
    name,
    email,
    password,
    role,
  }: IRequest): Promise<User> {
    const emailExists = await this.usersRepository.findByEmail(email);

    if (emailExists) {
      throw AppError.alreadyExists('email', 'Email already in use');
    }

    return this.usersRepository.create({
      name,
      email,
      password: await this.hashProvider.generateHash(password),
      role,
    });
  }
}
