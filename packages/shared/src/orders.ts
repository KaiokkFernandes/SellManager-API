import { z } from 'zod';
import { isoDateSchema, paginationQuerySchema } from './common';

export const ORDER_STATUSES = ['pending', 'completed', 'canceled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusSchema = z.enum(ORDER_STATUSES);

// ---- Entradas

export const createOrderBodySchema = z.object({
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
});

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  customer_id: z.uuid().optional(),
});

export const updateOrderStatusBodySchema = z.object({
  status: orderStatusSchema.exclude(['pending']),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;

// ---- Respostas

export const orderItemSchema = z
  .object({
    id: z.uuid(),
    order_id: z.uuid(),
    product_id: z.uuid(),
    price: z.number().describe('Preço unitário no momento da compra'),
    quantity: z.number().int(),
  })
  .meta({ id: 'OrderItem' });

export const orderSchema = z
  .object({
    id: z.uuid(),
    customer_id: z.uuid(),
    status: orderStatusSchema,
    total: z.number(),
    items: z.array(orderItemSchema),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({ id: 'Order' });

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
