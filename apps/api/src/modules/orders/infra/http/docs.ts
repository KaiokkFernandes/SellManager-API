import { z } from 'zod';
import {
  bearerAuth,
  body,
  DocsRegistry,
  errors,
  idParam,
  json,
  paginated,
} from '@shared/http/docs/helpers';
import { ORDER_STATUSES } from '../../domain/entities/Order';
import {
  createOrderBodySchema,
  listOrdersQuerySchema,
  updateOrderStatusBodySchema,
} from './schemas';

export function registerOrdersDocs(registry: DocsRegistry): void {
  const OrderItem = registry.register(
    'OrderItem',
    z.object({
      id: z.uuid(),
      order_id: z.uuid(),
      product_id: z.uuid(),
      price: z.number().describe('Preço unitário no momento da compra'),
      quantity: z.number().int(),
    }),
  );
  const Order = registry.register(
    'Order',
    z.object({
      id: z.uuid(),
      customer_id: z.uuid(),
      status: z.enum(ORDER_STATUSES),
      total: z.number(),
      items: z.array(OrderItem),
      created_at: z.iso.datetime(),
      updated_at: z.iso.datetime(),
    }),
  );
  const tags = ['Pedidos'];
  const security = bearerAuth;

  registry.registerPath({
    method: 'get',
    path: '/orders',
    operationId: 'listOrders',
    tags,
    security,
    summary: 'Lista pedidos (mais recentes primeiro)',
    request: { query: listOrdersQuerySchema },
    responses: {
      200: json(paginated(Order)),
      400: errors[400],
      401: errors[401],
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/orders/{id}',
    operationId: 'showOrder',
    tags,
    security,
    summary: 'Mostra um pedido com os itens',
    request: { params: idParam },
    responses: { 200: json(Order), 401: errors[401], 404: errors[404] },
  });

  registry.registerPath({
    method: 'post',
    path: '/orders',
    operationId: 'createOrder',
    tags,
    security,
    summary: 'Cria um pedido',
    description:
      'Em uma transação: trava os produtos, checa o estoque, copia o preço atual de cada produto, calcula o total e baixa o estoque. 409 se faltar estoque.',
    request: { body: body(createOrderBodySchema) },
    responses: {
      201: json(Order, 'Criado'),
      400: errors[400],
      401: errors[401],
      404: errors[404],
      409: errors[409],
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/orders/{id}/status',
    operationId: 'updateOrderStatus',
    tags,
    security,
    summary:
      'Conclui ou cancela um pedido pendente (cancelar devolve o estoque)',
    request: { params: idParam, body: body(updateOrderStatusBodySchema) },
    responses: {
      200: json(Order),
      400: errors[400],
      401: errors[401],
      404: errors[404],
      409: errors[409],
    },
  });
}
