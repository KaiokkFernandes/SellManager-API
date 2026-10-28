import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { ITokenProvider } from '@shared/providers/TokenProvider/ITokenProvider';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  user_id: string;
  current_password: string;
  password: string;
}

/**
 * Troca a própria senha. `password_changed_at` invalida todos os tokens
 * anteriores (outras abas/dispositivos); a sessão atual recebe um token novo.
 */
export class ChangePasswordService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly hashProvider: IHashProvider,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  public async execute({
    user_id,
    current_password,
    password,
  }: IRequest): Promise<{ user: User; token: string }> {
    const user = await this.usersRepository.findById(user_id);
    if (!user) throw new AppError('User not found', 404);

    if (
      !(await this.hashProvider.compareHash(current_password, user.password))
    ) {
      const message = 'Current password is incorrect';
      throw new AppError(message, 400, {
        code: 'VALIDATION_FAILED',
        issues: [{ segment: 'body', path: 'current_password', message }],
      });
    }

    const saved = await this.usersRepository.save({
      ...user,
      password: await this.hashProvider.generateHash(password),
      password_changed_at: new Date(),
    });
    const token = await this.tokenProvider.sign({ subject: user.id });
    return { user: saved, token };
  }
}
