import { z } from 'zod';
import { examples, isoDateSchema, moneyCentsSchema } from './common';

export const productBodySchema = z
  .object({
    name: z.string().trim().min(1),
    // limite da coluna decimal(10,2) do banco: 99.999.999,99
    price_cents: moneyCentsSchema.max(9_999_999_999),
    quantity: z.number().int().nonnegative(),
  })
  .meta({
    id: 'ProductBody',
    example: { name: 'Teclado mecânico', price_cents: 19990, quantity: 10 },
  });

export type ProductBody = z.infer<typeof productBodySchema>;

export const productSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    price_cents: moneyCentsSchema,
    quantity: z.number().int(),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({
    id: 'Product',
    example: {
      id: examples.id,
      name: 'Teclado mecânico',
      price_cents: 19990,
      quantity: 10,
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export type Product = z.infer<typeof productSchema>;
