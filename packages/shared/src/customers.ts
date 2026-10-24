import { z } from 'zod';
import { isoDateSchema } from './common';

export const customerBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
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
  .meta({ id: 'Customer' });

export type Customer = z.infer<typeof customerSchema>;
