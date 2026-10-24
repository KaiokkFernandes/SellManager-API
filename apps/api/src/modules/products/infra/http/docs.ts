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
import { paginationQuerySchema, productSchema } from '@sellmanager/shared';
import { productBodySchema } from '@sellmanager/shared';

export function registerProductsDocs(registry: DocsRegistry): void {
  const Product = productSchema;
  const tags = ['Produtos'];

  registry.registerPath({
    method: 'get',
    path: '/products',
    operationId: 'listProducts',
    security: [],
    tags,
    summary: 'Lista produtos (público)',
    request: { query: paginationQuerySchema },
    responses: { 200: json(paginated(Product)), 400: errors[400] },
  });

  registry.registerPath({
    method: 'get',
    path: '/products/{id}',
    operationId: 'showProduct',
    security: [],
    tags,
    summary: 'Mostra um produto (público)',
    request: { params: idParam },
    responses: { 200: json(Product), 404: errors[404] },
  });

  registry.registerPath({
    method: 'post',
    path: '/products',
    operationId: 'createProduct',
    tags,
    summary: 'Cria um produto',
    security: bearerAuth,
    request: { body: body(productBodySchema) },
    responses: {
      201: json(Product, 'Criado'),
      400: errors[400],
      401: errors[401],
      409: errors[409],
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/products/{id}',
    operationId: 'updateProduct',
    tags,
    summary: 'Atualiza um produto',
    security: bearerAuth,
    request: { params: idParam, body: body(productBodySchema) },
    responses: {
      200: json(Product),
      400: errors[400],
      401: errors[401],
      404: errors[404],
      409: errors[409],
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/products/{id}',
    operationId: 'deleteProduct',
    tags,
    summary: 'Remove um produto (409 se houver pedidos com ele)',
    security: bearerAuth,
    request: { params: idParam },
    responses: {
      204: noContent,
      401: errors[401],
      404: errors[404],
      409: errors[409],
    },
  });
}
