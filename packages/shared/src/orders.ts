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

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  customer_id: z.uuid().optional(),
});

export const updateOrderStatusBodySchema = z
  .object({
    status: orderStatusSchema.exclude(['pending']),
  })
  .meta({ id: 'UpdateOrderStatusBody', example: { status: 'completed' } });

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;

// ---- Respostas

export const orderItemSchema = z
  .object({
    id: z.uuid(),
    order_id: z.uuid(),
    product_id: z.uuid(),
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
      status: 'pending',
      total_cents: 39980,
      items: [
        {
          id: 'a1b2c3d4-0000-4000-8000-000000000001',
          order_id: examples.id,
          product_id: '8d83dcee-0204-4a7e-8488-ea60dc369ca4',
          price_cents: 19990,
          quantity: 2,
        },
      ],
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
