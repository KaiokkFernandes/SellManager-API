import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '@config/env';
import Customer from '@modules/customers/typeorm/entities/Customers';
import Product from '@modules/product/typeorm/entities/Product';
import { UserSchema } from '@modules/users/infra/typeorm/schemas/UserSchema';
import { UserTokenSchema } from '@modules/users/infra/typeorm/schemas/UserTokenSchema';
import { CreateInitialSchema1761350400000 } from './migrations/1761350400000-CreateInitialSchema';

// Entidades e migrations são listadas explicitamente (sem glob) para funcionar
// igual em dev (tsx), no build (dist/) e nos testes.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [UserSchema, UserTokenSchema, Product, Customer],
  migrations: [CreateInitialSchema1761350400000],
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
