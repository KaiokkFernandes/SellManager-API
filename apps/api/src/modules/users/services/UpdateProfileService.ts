import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  user_id: string;
  name: string;
  email: string;
  password?: string;
  old_password?: string;
}

export class UpdateProfileService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly hashProvider: IHashProvider,
  ) {}

  public async execute({
    user_id,
    name,
    email,
    password,
    old_password,
  }: IRequest): Promise<User> {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userWithEmail = await this.usersRepository.findByEmail(email);

    if (userWithEmail && userWithEmail.id !== user_id) {
      throw AppError.alreadyExists('email', 'Email already in use');
    }

    if (password) {
      if (!old_password) {
        throw new AppError('You need to inform the old password');
      }

      const oldPasswordMatches = await this.hashProvider.compareHash(
        old_password,
        user.password,
      );

      if (!oldPasswordMatches) {
        throw new AppError('Old password does not match');
      }

      user.password = await this.hashProvider.generateHash(password);
    }

    user.name = name;
    user.email = email;

    return this.usersRepository.save(user);
  }
}
