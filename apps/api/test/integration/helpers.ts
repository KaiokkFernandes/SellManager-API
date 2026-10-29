import request from 'supertest';
import { Express } from 'express';
import type { Role } from '@sellmanager/shared';
import { CreateUserService } from '@modules/users/services/CreateUserService';
import { Container, makeContainer } from '@shared/container';
import { createApp } from '@shared/http/app';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import { FakeMailProvider } from '@shared/providers/MailProvider/FakeMailProvider';

export interface TestContext {
  app: Express;
  mail: FakeMailProvider;
  container: Container;
}

export async function createTestContext(): Promise<TestContext> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const mail = new FakeMailProvider();
  const container = makeContainer(AppDataSource, { mail });

  return { app: createApp(container), mail, container };
}

export async function resetDatabase(): Promise<void> {
  await AppDataSource.query(
    'TRUNCATE categories, stock_movements, order_status_history, order_items, orders, customers, products, user_tokens, users CASCADE',
  );
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

export const defaultUser = {
  name: 'Kaio',
  email: 'kaio@test.com',
  password: 'senha-segura-123',
};

interface TestUser {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

/**
 * Cria o usuário direto pelo service (o cadastro pela API exige um ADMIN).
 * Padrão: ADMIN com os dados de `defaultUser`.
 */
export async function createUser(ctx: TestContext, user: TestUser = {}) {
  const data = { ...defaultUser, role: 'ADMIN' as Role, ...user };
  const created = await new CreateUserService(
    ctx.container.repositories.users,
    ctx.container.providers.hash,
  ).execute(data);
  return { ...data, id: created.id };
}

/** Login de um usuário de teste; devolve o header Authorization pronto. */
export async function login(
  ctx: TestContext,
  { email, password }: { email: string; password: string },
): Promise<string> {
  const response = await request(ctx.app)
    .post('/sessions')
    .send({ email, password })
    .expect(200);
  return `Bearer ${(response.body as { token: string }).token}`;
}

/** Cria o usuário (ADMIN por padrão) e devolve o header Authorization. */
export async function authenticate(
  ctx: TestContext,
  user: TestUser = {},
): Promise<string> {
  return login(ctx, await createUser(ctx, user));
}

/**
 * Invariante do estoque: o saldo de cada produto é a soma das movimentações.
 * Devolve os produtos que divergem (vazio = consistente).
 */
export async function stockInconsistencies(): Promise<
  { id: string; quantity: number; ledger: number }[]
> {
  return AppDataSource.query(`
    SELECT p.id, p.quantity, COALESCE(SUM(m.quantity), 0)::int AS ledger
    FROM products p
    LEFT JOIN stock_movements m ON m.product_id = p.id
    GROUP BY p.id
    HAVING p.quantity <> COALESCE(SUM(m.quantity), 0)
  `);
}
