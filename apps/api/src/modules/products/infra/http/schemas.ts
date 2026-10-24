import { z } from 'zod';

export const productBodySchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().nonnegative().multipleOf(0.01),
  quantity: z.number().int().nonnegative(),
});

export type ProductBody = z.infer<typeof productBodySchema>;
