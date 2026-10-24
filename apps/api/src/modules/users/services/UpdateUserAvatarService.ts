import AppError from '@shared/errors/AppError';
import { IStorageProvider } from '@shared/providers/StorageProvider/IStorageProvider';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  user_id: string;
  avatarFileName: string;
}

export class UpdateUserAvatarService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  public async execute({ user_id, avatarFileName }: IRequest): Promise<User> {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new AppError('Only authenticated users can change avatar.', 401);
    }

    if (user.avatar) {
      await this.storageProvider.deleteFile(user.avatar);
    }

    user.avatar = await this.storageProvider.saveFile(avatarFileName);

    return this.usersRepository.save(user);
  }
}
