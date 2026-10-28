import { z } from 'zod';
import { productCategorySchema } from './categories';
import { imageFileSchema } from './uploads';
import {
  examples,
  isoDateSchema,
  moneyCentsSchema,
  paginationQuerySchema,
  searchSchema,
  sortOrderSchema,
} from './common';

export const productBodySchema = z
  .object({
    name: z.string().trim().min(1),
    // limite da coluna decimal(10,2) do banco: 99.999.999,99
    price_cents: moneyCentsSchema.max(9_999_999_999),
    quantity: z
      .number()
      .int()
      .nonnegative()
      .describe('Estoque inicial (registrado como movimentação INITIAL)'),
    category_id: z.uuid().nullable().default(null),
  })
  .meta({
    id: 'ProductBody',
    example: {
      name: 'Teclado mecânico',
      price_cents: 19990,
      quantity: 10,
      category_id: null,
    },
  });

/** Na edição o estoque não muda: só por movimentação (entrada/ajuste). */
export const updateProductBodySchema = productBodySchema
  .omit({ quantity: true })
  .meta({
    id: 'UpdateProductBody',
    example: {
      name: 'Teclado mecânico',
      price_cents: 19990,
      category_id: null,
    },
  });

export type ProductBody = z.infer<typeof productBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;

export const PRODUCT_SORTS = [
  'name',
  'price',
  'quantity',
  'created_at',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const listProductsQuerySchema = paginationQuerySchema.extend({
  q: searchSchema.meta({ description: 'Busca por nome' }),
  category_id: z.uuid().optional(),
  sort: z.enum(PRODUCT_SORTS).default('name'),
  order: sortOrderSchema,
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const productSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    price_cents: moneyCentsSchema,
    quantity: z.number().int(),
    category: productCategorySchema.nullable(),
    image_url: z.url().nullable(),
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
      category: {
        id: '2f1d3c4b-5a69-4788-9a0b-1c2d3e4f5a6b',
        name: 'Periféricos',
      },
      image_url:
        'http://localhost:3333/files/3f1c9a0b2d4e5f60718293a4b5c6d7e8.webp',
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export type Product = z.infer<typeof productSchema>;

/** Upload da imagem do produto (multipart/form-data, campo `image`). */
export const productImageUploadBodySchema = z
  .object({ image: imageFileSchema() })
  .meta({ id: 'ProductImageUploadBody' });
