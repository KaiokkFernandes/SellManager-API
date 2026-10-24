import { z } from 'zod';

export const customerBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type CustomerBody = z.infer<typeof customerBodySchema>;
