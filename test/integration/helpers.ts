import request from 'supertest';
import { Express } from 'express';
import { makeContainer } from '@shared/container';
import { createApp } from '@shared/http/app';
import { AppDataSource } from '@shared/infra/typeorm/data-source';
import { FakeMailProvider } from '@shared/providers/MailProvider/FakeMailProvider';

export interface TestContext {
  app: Express;
  mail: FakeMailProvider;
}

export async function createTestContext(): Promise<TestContext> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const mail = new FakeMailProvider();
  const app = createApp(makeContainer(AppDataSource, { mail }));

  return { app, mail };
}

export async function resetDatabase(): Promise<void> {
  await AppDataSource.query(
    'TRUNCATE order_items, orders, customers, products, user_tokens, users CASCADE',
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

/** Cadastra um usuário e devolve o header Authorization pronto. */
export async function authenticate(
  app: Express,
  user = defaultUser,
): Promise<string> {
  await request(app).post('/users').send(user).expect(201);

  const response = await request(app)
    .post('/sessions')
    .send({ email: user.email, password: user.password })
    .expect(200);

  return `Bearer ${(response.body as { token: string }).token}`;
}
