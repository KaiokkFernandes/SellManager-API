/* eslint-disable no-console -- comando de terminal */
// Instalação: cria o primeiro ADMIN (o seed é só de desenvolvimento e criar
// usuário pela API exige já ser ADMIN).
//   pnpm --filter api create-admin        (dev)
//   pnpm --filter api create-admin:prod   (produção, a partir do dist/)
// Lê ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD; o que faltar é perguntado no
// terminal. A senha nunca vem por argumento: ficaria no histórico e no `ps`.
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { createUserBodySchema } from '@sellmanager/shared';
import { CreateFirstAdminService } from '@modules/users/services/CreateFirstAdminService';
import { makeContainer } from '@shared/container';
import { AppDataSource } from '@shared/infra/typeorm/data-source';

async function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk: Buffer, _encoding, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const terminal = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });
  const answer = terminal.question(question);
  muted = hidden; // a pergunta já saiu: só o que for digitado fica sem eco
  const value = await answer;
  terminal.close();
  if (hidden) process.stdout.write('\n');
  return value;
}

async function readInput() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  const missing = !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD;
  if (missing && !process.stdin.isTTY) {
    throw new Error(
      'Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (sem terminal interativo não há como perguntar).',
    );
  }
  return {
    name: ADMIN_NAME ?? (await ask('Nome: ')),
    email: ADMIN_EMAIL ?? (await ask('E-mail: ')),
    password: ADMIN_PASSWORD ?? (await ask('Senha (mín. 8): ', true)),
  };
}

async function main(): Promise<void> {
  // mesmas regras do cadastro pela API
  const parsed = createUserBodySchema.safeParse({
    ...(await readInput()),
    role: 'ADMIN',
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      issue => `  ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Dados inválidos:\n${issues.join('\n')}`);
  }

  await AppDataSource.initialize();
  const { usersUnitOfWork, providers } = makeContainer(AppDataSource);
  const admin = await new CreateFirstAdminService(
    usersUnitOfWork,
    providers.hash,
  ).execute(parsed.data);

  console.log(
    admin
      ? `ADMIN criado: ${admin.email}. Entre e cadastre os demais em Usuários.`
      : 'Já existe um ADMIN ativo: nada foi feito. Use a tela de Usuários.',
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => AppDataSource.isInitialized && AppDataSource.destroy());
