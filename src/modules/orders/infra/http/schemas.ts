import { z } from 'zod';
import { ORDER_STATUSES } from '../../domain/entities/Order';

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

export const listOrdersQuerySchema = z.object({
  customer_id: z.uuid().optional(),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(ORDER_STATUSES).exclude(['pending']),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;
