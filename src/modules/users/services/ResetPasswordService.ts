import { addHours, isAfter } from 'date-fns';
import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { IUserTokensRepository } from '../domain/repositories/IUserTokensRepository';

interface IRequest {
  token: string;
  password: string;
}

const TOKEN_EXPIRATION_HOURS = 2;

export class ResetPasswordService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly userTokensRepository: IUserTokensRepository,
    private readonly hashProvider: IHashProvider,
  ) {}

  public async execute({ token, password }: IRequest): Promise<void> {
    const userToken = await this.userTokensRepository.findByToken(token);

    if (!userToken) {
      throw new AppError('User token does not exists');
    }

    const user = await this.usersRepository.findById(userToken.user_id);

    if (!user) {
      throw new AppError('User does not exists');
    }

    if (
      isAfter(
        Date.now(),
        addHours(userToken.created_at, TOKEN_EXPIRATION_HOURS),
      )
    ) {
      throw new AppError('Token expired');
    }

    user.password = await this.hashProvider.generateHash(password);

    await this.usersRepository.save(user);
  }
}
