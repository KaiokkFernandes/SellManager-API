import AppError from '@shared/errors/AppError';
import {
  IFileToStore,
  IStorageProvider,
} from '@shared/providers/StorageProvider/IStorageProvider';
import { User } from '../domain/entities/User';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';

interface IRequest {
  user_id: string;
  avatar: IFileToStore;
}

/** A foto anterior só é apagada depois que o banco aponta para a nova. */
export class UpdateUserAvatarService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  public async execute({ user_id, avatar }: IRequest): Promise<User> {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new AppError('Only authenticated users can change avatar.', 401);
    }

    const previous = user.avatar;
    const url = await this.storageProvider.save(avatar);
    user.avatar = url;

    let saved: User;
    try {
      saved = await this.usersRepository.save(user);
    } catch (error) {
      await this.storageProvider.delete(url);
      throw error;
    }

    if (previous) await this.storageProvider.delete(previous);
    return saved;
  }
}
