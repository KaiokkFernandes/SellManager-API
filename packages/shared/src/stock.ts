import { z } from 'zod';
import { examples, isoDateSchema, paginationQuerySchema } from './common';
import { because } from './validation';

/**
 * Toda mudança de estoque vira uma movimentação; o saldo do produto é sempre
 * a soma delas.
 *
 * - INITIAL: saldo inicial (cadastro do produto e migração)
 * - ENTRY: entrada de mercadoria (+)
 * - SALE: saída por venda, na criação do pedido (−)
 * - CANCEL_RETURN: devolução por cancelamento do pedido (+)
 * - ADJUSTMENT: ajuste manual (±), motivo obrigatório
 */
export const STOCK_MOVEMENT_TYPES = [
  'INITIAL',
  'ENTRY',
  'SALE',
  'CANCEL_RETURN',
  'ADJUSTMENT',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];
export const stockMovementTypeSchema = z.enum(STOCK_MOVEMENT_TYPES);

/** Tipos que uma pessoa registra à mão (os demais vêm do sistema). */
export const MANUAL_STOCK_MOVEMENT_TYPES = ['ENTRY', 'ADJUSTMENT'] as const;
export type ManualStockMovementType =
  (typeof MANUAL_STOCK_MOVEMENT_TYPES)[number];

const MAX_MOVEMENT = 1_000_000;

export const stockMovementBodySchema = z
  .object({
    type: z.enum(MANUAL_STOCK_MOVEMENT_TYPES),
    quantity: z
      .number()
      .int()
      .min(-MAX_MOVEMENT)
      .max(MAX_MOVEMENT)
      .describe('Positiva na entrada; no ajuste, negativa para retirar'),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    ({ quantity }) => quantity !== 0,
    because('zero_quantity', 'quantity'),
  )
  .refine(
    ({ type, quantity }) => type !== 'ENTRY' || quantity > 0,
    because('negative_entry', 'quantity'),
  )
  .refine(
    ({ type, reason }) => type !== 'ADJUSTMENT' || (reason ?? '').length >= 3,
    because('reason_required', 'reason'),
  )
  .meta({
    id: 'StockMovementBody',
    example: { type: 'ADJUSTMENT', quantity: -2, reason: 'Avaria no estoque' },
  });

export type StockMovementBody = z.infer<typeof stockMovementBodySchema>;

export const listStockMovementsQuerySchema = paginationQuerySchema;
export type ListStockMovementsQuery = z.infer<
  typeof listStockMovementsQuerySchema
>;

export const stockMovementSchema = z
  .object({
    id: z.uuid(),
    product_id: z.uuid(),
    type: stockMovementTypeSchema,
    quantity: z.number().int().describe('Com sinal: + entra, − sai'),
    balance_after: z.number().int().describe('Saldo do produto após'),
    reason: z.string().nullable(),
    order_id: z.uuid().nullable().describe('Em SALE e CANCEL_RETURN'),
    created_by: z
      .object({ id: z.uuid(), name: z.string() })
      .nullable()
      .describe('null em registros migrados'),
    created_at: isoDateSchema,
  })
  .meta({
    id: 'StockMovement',
    example: {
      id: examples.id,
      product_id: '8d83dcee-0204-4a7e-8488-ea60dc369ca4',
      type: 'SALE',
      quantity: -2,
      balance_after: 8,
      reason: null,
      order_id: '6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
      created_by: {
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        name: 'Ana',
      },
      created_at: examples.date,
    },
  });

export type StockMovement = z.infer<typeof stockMovementSchema>;
