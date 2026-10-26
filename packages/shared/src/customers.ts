import { z } from 'zod';
import { examples, isoDateSchema } from './common';

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
