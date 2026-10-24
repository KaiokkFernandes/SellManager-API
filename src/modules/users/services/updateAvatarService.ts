import AppError from '@shared/erros/AppError';
import Users from '../typeorm/entities/Users';
import UserRepository from '../typeorm/repositories/UserRepository';
import path from 'path';
import uploadConfig from '@config/upload';
import fs from 'fs';

interface IRequest {
  user_id: string;
  avatarFileName: string;
}

class UpdateAvatarService {
  public async execute({ user_id, avatarFileName }: IRequest): Promise<Users> {
    const usersRepository = new UserRepository();

    const user = await usersRepository.findById(user_id);

    if (!user) {
      throw new AppError('Only authenticated users can change avatar.', 401);
    }

    if (user.avatar) {
      const userAvalarFilePatch = path.join(
        uploadConfig.directory,
        user.avatar,
      );
      const userAvalarFileExists = await fs.promises.stat(userAvalarFilePatch);

      if (userAvalarFileExists) {
        await fs.promises.unlink(userAvalarFilePatch);
      }
    }
    user.avatar = avatarFileName;

    await usersRepository.save(user);

    return user;
  }
}

export default UpdateAvatarService;
