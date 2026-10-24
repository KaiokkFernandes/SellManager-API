import { DataSource } from 'typeorm';
import { env } from '@config/env';
import uploadConfig from '@config/upload';
import { CustomersRepository } from '@modules/customers/infra/typeorm/repositories/CustomersRepository';
import { ProductsRepository } from '@modules/products/infra/typeorm/repositories/ProductsRepository';
import { UsersRepository } from '@modules/users/infra/typeorm/repositories/UsersRepository';
import { UserTokensRepository } from '@modules/users/infra/typeorm/repositories/UserTokensRepository';
import { BcryptHashProvider } from '@shared/providers/HashProvider/BcryptHashProvider';
import { IHashProvider } from '@shared/providers/HashProvider/IHashProvider';
import { EtherealMailProvider } from '@shared/providers/MailProvider/EtherealMailProvider';
import { IMailProvider } from '@shared/providers/MailProvider/IMailProvider';
import { HandlebarsMailTemplateProvider } from '@shared/providers/MailTemplateProvider/HandlebarsMailTemplateProvider';
import { DiskStorageProvider } from '@shared/providers/StorageProvider/DiskStorageProvider';
import { IStorageProvider } from '@shared/providers/StorageProvider/IStorageProvider';
import { ITokenProvider } from '@shared/providers/TokenProvider/ITokenProvider';
import { JoseTokenProvider } from '@shared/providers/TokenProvider/JoseTokenProvider';

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
    hash: new BcryptHashProvider(),
    token: new JoseTokenProvider(env.JWT_SECRET, env.JWT_EXPIRES_IN),
    mail: new EtherealMailProvider(new HandlebarsMailTemplateProvider()),
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
    customers: new CustomersRepository(dataSource),
  };

  return { config: env, providers, repositories };
}

export type Container = ReturnType<typeof makeContainer>;
