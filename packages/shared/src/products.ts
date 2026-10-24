import { z } from 'zod';
import { isoDateSchema } from './common';

export const productBodySchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().nonnegative().multipleOf(0.01),
  quantity: z.number().int().nonnegative(),
});

export type ProductBody = z.infer<typeof productBodySchema>;

export const productSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().int(),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({ id: 'Product' });

export type Product = z.infer<typeof productSchema>;
