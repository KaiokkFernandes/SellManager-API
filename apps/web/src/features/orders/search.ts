import { z } from 'zod';

const day = z.iso.date().optional().catch(undefined);

/** Filtros da lista de pedidos na URL: ?customer_id=&from=AAAA-MM-DD&to=AAAA-MM-DD&page= */
export const ordersSearchSchema = z.object({
  customer_id: z.uuid().optional().catch(undefined),
  from: day,
  to: day,
  page: z.number().int().positive().optional().catch(undefined),
});

/** Novo pedido pode vir com o cliente pré-selecionado (ex.: do detalhe do cliente). */
export const newOrderSearchSchema = z.object({
  customer_id: z.uuid().optional().catch(undefined),
});
