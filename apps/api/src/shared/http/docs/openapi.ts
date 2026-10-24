import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { registerCustomersDocs } from '@modules/customers/infra/http/docs';
import { registerOrdersDocs } from '@modules/orders/infra/http/docs';
import { registerProductsDocs } from '@modules/products/infra/http/docs';
import { registerUsersDocs } from '@modules/users/infra/http/docs';

export function generateOpenApiDocument(serverUrl: string) {
  const registry = new OpenAPIRegistry();

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  registerUsersDocs(registry);
  registerProductsDocs(registry);
  registerCustomersDocs(registry);
  registerOrdersDocs(registry);

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'SellManager API',
      version: '1.0.0',
      description:
        'API de gestão de vendas: usuários, produtos, clientes e pedidos.',
    },
    servers: [{ url: serverUrl }],
  });
}
