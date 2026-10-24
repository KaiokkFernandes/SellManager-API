import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '@config/env';
import { CustomerSchema } from '@modules/customers/infra/typeorm/schemas/CustomerSchema';
import { ProductSchema } from '@modules/products/infra/typeorm/schemas/ProductSchema';
import { UserSchema } from '@modules/users/infra/typeorm/schemas/UserSchema';
import { UserTokenSchema } from '@modules/users/infra/typeorm/schemas/UserTokenSchema';
import { CreateInitialSchema1761350400000 } from './migrations/1761350400000-CreateInitialSchema';
import { HashUserTokens1761350500000 } from './migrations/1761350500000-HashUserTokens';

// Entidades e migrations são listadas explicitamente (sem glob) para funcionar
// igual em dev (tsx), no build (dist/) e nos testes.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [UserSchema, UserTokenSchema, ProductSchema, CustomerSchema],
  migrations: [CreateInitialSchema1761350400000, HashUserTokens1761350500000],
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
