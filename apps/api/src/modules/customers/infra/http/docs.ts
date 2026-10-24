import {
  bearerAuth,
  body,
  DocsRegistry,
  errors,
  idParam,
  json,
  noContent,
  paginated,
} from '@shared/http/docs/helpers';
import { customerSchema, paginationQuerySchema } from '@sellmanager/shared';
import { customerBodySchema } from '@sellmanager/shared';

export function registerCustomersDocs(registry: DocsRegistry): void {
  const Customer = customerSchema;
  const tags = ['Clientes'];
  const security = bearerAuth;

  registry.registerPath({
    method: 'get',
    path: '/customers',
    operationId: 'listCustomers',
    tags,
    security,
    summary: 'Lista clientes',
    request: { query: paginationQuerySchema },
    responses: { 200: json(paginated(Customer)), 401: errors[401] },
  });

  registry.registerPath({
    method: 'get',
    path: '/customers/{id}',
    operationId: 'showCustomer',
    tags,
    security,
    summary: 'Mostra um cliente',
    request: { params: idParam },
    responses: { 200: json(Customer), 401: errors[401], 404: errors[404] },
  });

  registry.registerPath({
    method: 'post',
    path: '/customers',
    operationId: 'createCustomer',
    tags,
    security,
    summary: 'Cria um cliente',
    request: { body: body(customerBodySchema) },
    responses: {
      201: json(Customer, 'Criado'),
      400: errors[400],
      401: errors[401],
      409: errors[409],
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/customers/{id}',
    operationId: 'updateCustomer',
    tags,
    security,
    summary: 'Atualiza um cliente',
    request: { params: idParam, body: body(customerBodySchema) },
    responses: {
      200: json(Customer),
      400: errors[400],
      401: errors[401],
      404: errors[404],
      409: errors[409],
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/customers/{id}',
    operationId: 'deleteCustomer',
    tags,
    security,
    summary: 'Remove um cliente (409 se houver pedidos dele)',
    request: { params: idParam },
    responses: {
      204: noContent,
      401: errors[401],
      404: errors[404],
      409: errors[409],
    },
  });
}
