import path from 'node:path';
import { IMailProvider } from '@shared/providers/MailProvider/IMailProvider';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { IUserTokensRepository } from '../domain/repositories/IUserTokensRepository';

interface IRequest {
  email: string;
}

export class SendForgotPasswordEmailService {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly userTokensRepository: IUserTokensRepository,
    private readonly mailProvider: IMailProvider,
    private readonly webUrl: string,
  ) {}

  public async execute({ email }: IRequest): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    // Responde igual para e-mails inexistentes, para não permitir enumeração.
    if (!user) {
      return;
    }

    const { token } = await this.userTokensRepository.generate(user.id);

    await this.mailProvider.sendMail({
      to: { name: user.name, email: user.email },
      subject: '[SellManager] Recuperação de senha',
      templateData: {
        file: path.resolve(__dirname, '..', 'views', 'forgot_password.hbs'),
        variables: {
          name: user.name,
          link: `${this.webUrl}/reset_password?token=${token}`,
        },
      },
    });
  }
}
