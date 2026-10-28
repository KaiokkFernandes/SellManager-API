import { z } from 'zod';
import {
  examples,
  isoDateSchema,
  moneyCentsSchema,
  paginationQuerySchema,
} from './common';

export const ORDER_STATUSES = ['pending', 'completed', 'canceled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusSchema = z.enum(ORDER_STATUSES);

// ---- Entradas

export const createOrderBodySchema = z
  .object({
    customer_id: z.uuid(),
    products: z
      .array(
        z.object({
          id: z.uuid(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1)
      .max(100),
  })
  .meta({
    id: 'CreateOrderBody',
    example: {
      customer_id: '6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
      products: [{ id: '8d83dcee-0204-4a7e-8488-ea60dc369ca4', quantity: 2 }],
    },
  });

const instantSchema = z.iso.datetime({ offset: true });

export const listOrdersQuerySchema = paginationQuerySchema
  .extend({
    customer_id: z.uuid().optional(),
    from: instantSchema.optional().meta({
      description:
        'Criados a partir deste instante, inclusivo (ISO 8601, ex.: 2026-10-01T00:00:00-03:00)',
    }),
    to: instantSchema.optional().meta({
      description: 'Criados antes deste instante, exclusivo (ISO 8601)',
    }),
  })
  .refine(({ from, to }) => !from || !to || new Date(from) < new Date(to), {
    path: ['to'],
    message: '`to` must be after `from`',
  });

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

// ---- Respostas

export const orderCustomerSchema = z
  .object({ id: z.uuid(), name: z.string(), email: z.email() })
  .meta({ id: 'OrderCustomer' });

export const orderProductSchema = z
  .object({ id: z.uuid(), name: z.string() })
  .meta({
    id: 'OrderProduct',
    description: 'Nome atual do produto (o preço do item é o da compra)',
  });

export const orderItemSchema = z
  .object({
    id: z.uuid(),
    order_id: z.uuid(),
    product_id: z.uuid(),
    product: orderProductSchema,
    price_cents: moneyCentsSchema.describe(
      'Preço unitário em centavos no momento da compra',
    ),
    quantity: z.number().int(),
  })
  .meta({ id: 'OrderItem' });

export const orderSchema = z
  .object({
    id: z.uuid(),
    customer_id: z.uuid(),
    customer: orderCustomerSchema,
    status: orderStatusSchema,
    total_cents: moneyCentsSchema,
    items: z.array(orderItemSchema),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({
    id: 'Order',
    example: {
      id: examples.id,
      customer_id: '6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
      customer: {
        id: '6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
        name: 'Ana Souza',
        email: 'ana@example.com',
      },
      status: 'pending',
      total_cents: 39980,
      items: [
        {
          id: 'a1b2c3d4-0000-4000-8000-000000000001',
          order_id: examples.id,
          product_id: '8d83dcee-0204-4a7e-8488-ea60dc369ca4',
          product: {
            id: '8d83dcee-0204-4a7e-8488-ea60dc369ca4',
            name: 'Teclado mecânico',
          },
          price_cents: 19990,
          quantity: 2,
        },
      ],
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export type OrderCustomer = z.infer<typeof orderCustomerSchema>;
export type OrderProduct = z.infer<typeof orderProductSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
