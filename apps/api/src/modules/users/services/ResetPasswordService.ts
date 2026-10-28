import { addHours, isAfter } from 'date-fns';
import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { IUserTokensRepository } from '../domain/repositories/IUserTokensRepository';
import { hashResetToken } from '../domain/resetToken';

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
    const userToken = await this.userTokensRepository.findByTokenHash(
      hashResetToken(token),
    );

    if (!userToken) {
      throw new AppError('Invalid or expired token');
    }

    if (
      isAfter(
        Date.now(),
        addHours(userToken.created_at, TOKEN_EXPIRATION_HOURS),
      )
    ) {
      await this.userTokensRepository.deleteByUserId(userToken.user_id);
      throw new AppError('Invalid or expired token');
    }

    const user = await this.usersRepository.findById(userToken.user_id);

    if (!user?.active) {
      throw new AppError('Invalid or expired token');
    }

    user.password = await this.hashProvider.generateHash(password);
    // sessões abertas antes da troca deixam de valer
    user.password_changed_at = new Date();
    await this.usersRepository.save(user);

    // Uso único: o token deixa de valer depois de redefinir a senha.
    await this.userTokensRepository.deleteByUserId(user.id);
  }
}
