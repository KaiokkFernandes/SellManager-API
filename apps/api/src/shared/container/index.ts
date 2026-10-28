import { DataSource } from 'typeorm';
import { env } from '@config/env';
import uploadConfig from '@config/upload';
import { CustomersRepository } from '@modules/customers/infra/typeorm/repositories/CustomersRepository';
import { OrdersUnitOfWork } from '@modules/orders/infra/typeorm/OrdersUnitOfWork';
import { UsersUnitOfWork } from '@modules/users/infra/typeorm/UsersUnitOfWork';
import { OrdersRepository } from '@modules/orders/infra/typeorm/repositories/OrdersRepository';
import { OrderStatusHistoryRepository } from '@modules/orders/infra/typeorm/repositories/OrderStatusHistoryRepository';
import { ProductsUnitOfWork } from '@modules/products/infra/typeorm/ProductsUnitOfWork';
import { ProductsRepository } from '@modules/products/infra/typeorm/repositories/ProductsRepository';
import { StockMovementsRepository } from '@modules/products/infra/typeorm/repositories/StockMovementsRepository';
import { UsersRepository } from '@modules/users/infra/typeorm/repositories/UsersRepository';
import { UserTokensRepository } from '@modules/users/infra/typeorm/repositories/UserTokensRepository';
import { BcryptHashProvider } from '@shared/providers/HashProvider/BcryptHashProvider';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { EtherealMailProvider } from '@shared/providers/MailProvider/EtherealMailProvider';
import { IMailProvider } from '@shared/providers/MailProvider/IMailProvider';
import { SmtpMailProvider } from '@shared/providers/MailProvider/SmtpMailProvider';
import { HandlebarsMailTemplateProvider } from '@shared/providers/MailTemplateProvider/HandlebarsMailTemplateProvider';
import { DiskStorageProvider } from '@shared/providers/StorageProvider/DiskStorageProvider';
import { IStorageProvider } from '@shared/providers/StorageProvider/IStorageProvider';
import { ITokenProvider } from '@shared/providers/TokenProvider/ITokenProvider';
import { JoseTokenProvider } from '@shared/providers/TokenProvider/JoseTokenProvider';

function makeMailProvider(): IMailProvider {
  const templateProvider = new HandlebarsMailTemplateProvider();
  const from = { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_EMAIL };

  if (env.MAIL_DRIVER === 'smtp') {
    return new SmtpMailProvider(
      templateProvider,
      {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
      },
      from,
    );
  }

  return new EtherealMailProvider(templateProvider, from);
}

export interface Providers {
  hash: IHashProvider;
  token: ITokenProvider;
  mail: IMailProvider;
  storage: IStorageProvider;
}

/**
 * Composition root: o único lugar que conhece as implementações concretas.
 * Services e controllers recebem apenas interfaces.
 */
export function makeContainer(
  dataSource: DataSource,
  overrides: Partial<Providers> = {},
) {
  const providers: Providers = {
    hash: new BcryptHashProvider(env.BCRYPT_SALT_ROUNDS),
    token: new JoseTokenProvider(env.JWT_SECRET, env.JWT_EXPIRES_IN),
    mail: makeMailProvider(),
    storage: new DiskStorageProvider(
      uploadConfig.tmpFolder,
      uploadConfig.uploadsFolder,
    ),
    ...overrides,
  };

  const repositories = {
    users: new UsersRepository(dataSource),
    userTokens: new UserTokensRepository(dataSource),
    products: new ProductsRepository(dataSource),
    stockMovements: new StockMovementsRepository(dataSource),
    customers: new CustomersRepository(dataSource),
    orders: new OrdersRepository(dataSource),
    orderStatusHistory: new OrderStatusHistoryRepository(dataSource),
  };

  return {
    config: env,
    providers,
    repositories,
    ordersUnitOfWork: new OrdersUnitOfWork(dataSource),
    productsUnitOfWork: new ProductsUnitOfWork(dataSource),
    usersUnitOfWork: new UsersUnitOfWork(dataSource),
  };
}

export type Container = ReturnType<typeof makeContainer>;
