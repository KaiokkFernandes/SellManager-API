import AppError from '@shared/errors/AppError';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { User } from '../domain/entities/User';
import { IUsersUnitOfWork } from '../domain/repositories/IUsersUnitOfWork';

interface IRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Instalação: cria o primeiro ADMIN, que depois cria os demais usuários. Só
 * age sem nenhum ADMIN ativo (devolve null nos outros casos), então rodar de
 * novo num deploy não cria um administrador por fora da gestão de usuários.
 */
export class CreateFirstAdminService {
  constructor(
    private readonly unitOfWork: IUsersUnitOfWork,
    private readonly hashProvider: IHashProvider,
  ) {}

  public execute({ name, email, password }: IRequest): Promise<User | null> {
    return this.unitOfWork.run(async users => {
      if ((await users.lockActiveAdmins()).length > 0) return null;

      if (await users.findByEmail(email)) {
        throw AppError.alreadyExists('email', 'Email already in use');
      }

      return users.create({
        name,
        email,
        password: await this.hashProvider.generateHash(password),
        role: 'ADMIN',
      });
    });
  }
}
