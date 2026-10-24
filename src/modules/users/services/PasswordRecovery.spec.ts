import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { FakeHashProvider } from '@shared/providers/HashProvider/FakeHashProvider';
import { FakeMailProvider } from '@shared/providers/MailProvider/FakeMailProvider';
import { User } from '../domain/entities/User';
import { FakeUserTokensRepository } from '../fakes/FakeUserTokensRepository';
import { FakeUsersRepository } from '../fakes/FakeUsersRepository';
import { ResetPasswordService } from './ResetPasswordService';
import { SendForgotPasswordEmailService } from './SendForgotPasswordEmailService';

describe('Recuperação de senha', () => {
  let usersRepository: FakeUsersRepository;
  let userTokensRepository: FakeUserTokensRepository;
  let mailProvider: FakeMailProvider;
  let sendForgotPasswordEmail: SendForgotPasswordEmailService;
  let resetPassword: ResetPasswordService;
  let user: User;

  beforeEach(async () => {
    usersRepository = new FakeUsersRepository();
    userTokensRepository = new FakeUserTokensRepository();
    mailProvider = new FakeMailProvider();
    sendForgotPasswordEmail = new SendForgotPasswordEmailService(
      usersRepository,
      userTokensRepository,
      mailProvider,
      'http://web.test',
    );
    resetPassword = new ResetPasswordService(
      usersRepository,
      userTokensRepository,
      new FakeHashProvider(),
    );
    user = await usersRepository.create({
      name: 'Kaio',
      email: 'kaio@test.com',
      password: 'hashed:old',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('envia e-mail com link contendo o token', async () => {
    await sendForgotPasswordEmail.execute({ email: 'kaio@test.com' });

    const [token] = userTokensRepository.tokens;
    expect(mailProvider.messages).toHaveLength(1);
    expect(mailProvider.messages[0]?.templateData.variables.link).toBe(
      `http://web.test/reset_password?token=${token?.token}`,
    );
  });

  it('não revela se o e-mail existe: não falha e não envia nada', async () => {
    await expect(
      sendForgotPasswordEmail.execute({ email: 'nao@existe.com' }),
    ).resolves.toBeUndefined();
    expect(mailProvider.messages).toHaveLength(0);
  });

  it('redefine a senha com um token válido', async () => {
    const { token } = await userTokensRepository.generate(user.id);

    await resetPassword.execute({ token, password: 'nova' });

    expect((await usersRepository.findById(user.id))?.password).toBe(
      'hashed:nova',
    );
  });

  it('rejeita token expirado (mais de 2h)', async () => {
    const { token } = await userTokensRepository.generate(user.id);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000);

    await expect(
      resetPassword.execute({ token, password: 'nova' }),
    ).rejects.toThrow('Token expired');
  });

  it('rejeita token inexistente', async () => {
    await expect(
      resetPassword.execute({ token: 'inexistente', password: 'nova' }),
    ).rejects.toThrow();
  });
});
