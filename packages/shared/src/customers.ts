import { z } from 'zod';
import {
  examples,
  isoDateSchema,
  paginationQuerySchema,
  searchSchema,
  sortOrderSchema,
} from './common';

export const customerBodySchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim().toLowerCase().pipe(z.email()),
  })
  .meta({
    id: 'CustomerBody',
    example: { name: 'Ana Souza', email: 'ana@example.com' },
  });

export type CustomerBody = z.infer<typeof customerBodySchema>;

export const CUSTOMER_SORTS = ['name', 'email', 'created_at'] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  q: searchSchema.meta({ description: 'Busca por nome ou e-mail' }),
  sort: z.enum(CUSTOMER_SORTS).default('name'),
  order: sortOrderSchema,
});
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const customerSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({
    id: 'Customer',
    example: {
      id: examples.id,
      name: 'Ana Souza',
      email: 'ana@example.com',
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export type Customer = z.infer<typeof customerSchema>;
