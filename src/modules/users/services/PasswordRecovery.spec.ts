import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  /** Pede a recuperação e devolve o token em claro que foi no link do e-mail. */
  async function requestToken(): Promise<string> {
    await sendForgotPasswordEmail.execute({ email: user.email });
    const link = String(
      mailProvider.messages.at(-1)?.templateData.variables.link,
    );
    return new URL(link).searchParams.get('token') ?? '';
  }

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

  it('envia o link por e-mail e guarda apenas o hash do token', async () => {
    const token = await requestToken();

    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(userTokensRepository.tokens).toHaveLength(1);
    expect(userTokensRepository.tokens[0]?.token_hash).not.toBe(token);
  });

  it('não revela se o e-mail existe: não falha e não envia nada', async () => {
    await expect(
      sendForgotPasswordEmail.execute({ email: 'nao@existe.com' }),
    ).resolves.toBeUndefined();
    expect(mailProvider.messages).toHaveLength(0);
  });

  it('um novo pedido invalida o link anterior', async () => {
    const first = await requestToken();
    await requestToken();

    await expect(
      resetPassword.execute({ token: first, password: 'nova-senha' }),
    ).rejects.toThrow('Invalid or expired token');
  });

  it('redefine a senha e o token não pode ser reutilizado', async () => {
    const token = await requestToken();

    await resetPassword.execute({ token, password: 'nova-senha' });

    expect((await usersRepository.findById(user.id))?.password).toBe(
      'hashed:nova-senha',
    );
    await expect(
      resetPassword.execute({ token, password: 'outra-senha' }),
    ).rejects.toThrow('Invalid or expired token');
  });

  it('rejeita token expirado (mais de 2h)', async () => {
    const token = await requestToken();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000);

    await expect(
      resetPassword.execute({ token, password: 'nova-senha' }),
    ).rejects.toThrow('Invalid or expired token');
  });

  it('rejeita token inexistente', async () => {
    await expect(
      resetPassword.execute({ token: 'inexistente', password: 'nova-senha' }),
    ).rejects.toThrow('Invalid or expired token');
  });
});
