import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { ITokenProvider } from '@shared/providers/TokenProvider/ITokenProvider';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: User;
  token: string;
}

export class AuthenticateUserService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly hashProvider: IHashProvider,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const passwordMatches = await this.hashProvider.compareHash(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new AppError('Incorret password, please try again.', 401);
    }

    const token = await this.tokenProvider.sign({ subject: user.id });

    return { user, token };
  }
}
