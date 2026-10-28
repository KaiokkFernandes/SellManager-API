import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  type RouteConfig as OpenApiRouteConfig,
} from '@asteasolutions/zod-to-openapi';
import {
  allRoutes,
  apiErrorSchema,
  can,
  ERROR_DESCRIPTIONS,
  ROLES,
  type RouteDefinition,
} from '@sellmanager/shared';

const SUCCESS_DESCRIPTIONS: Record<number, string> = {
  200: 'OK',
  201: 'Criado',
  204: 'Sem conteúdo',
};

/** Quem pode chamar a rota, a partir do mapa de permissões do shared. */
function describeAccess(route: RouteDefinition): string | undefined {
  if (!route.auth) return route.description;
  if (route.permission === 'authenticated') {
    return [route.description, 'Qualquer usuário autenticado.']
      .filter(Boolean)
      .join('\n\n');
  }
  const { permission } = route;
  const roles = ROLES.filter(role => can(role, permission));
  return [
    route.description,
    `Permissão: \`${permission}\` (${roles.join(', ')}).`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function toOpenApiRoute(route: RouteDefinition): OpenApiRouteConfig {
  const { params, query, body, bodyType } = route.request ?? {};

  const responses: OpenApiRouteConfig['responses'] = {};
  for (const [status, schema] of Object.entries(route.responses)) {
    responses[status] = schema
      ? {
          description: SUCCESS_DESCRIPTIONS[Number(status)] ?? 'OK',
          content: { 'application/json': { schema } },
        }
      : { description: SUCCESS_DESCRIPTIONS[Number(status)] ?? 'Sem conteúdo' };
  }
  for (const status of route.errorStatuses) {
    responses[status] = {
      description: ERROR_DESCRIPTIONS[status],
      content: { 'application/json': { schema: apiErrorSchema } },
    };
  }

  return {
    method: route.method,
    path: route.path,
    operationId: route.operationId,
    summary: route.summary,
    ...(describeAccess(route) && { description: describeAccess(route) }),
    ...(route.auth &&
      route.permission !== 'authenticated' && {
        'x-permission': route.permission,
      }),
    tags: [...route.tags],
    security: route.auth ? [{ bearerAuth: [] }] : [],
    request: {
      ...(params && { params: params as never }),
      ...(query && { query: query as never }),
      ...(body && {
        body: {
          required: true,
          content: {
            [bodyType === 'multipart'
              ? 'multipart/form-data'
              : 'application/json']: {
              schema: body,
            },
          },
        },
      }),
    },
    responses,
  };
}

/** Gera o documento OpenAPI 3.1 a partir do contrato de @sellmanager/shared. */
export function generateOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  for (const route of allRoutes) {
    registry.registerPath(toOpenApiRoute(route));
  }

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'SellManager API',
      version: '1.0.0',
      description:
        'API de gestão de vendas: usuários, produtos, clientes e pedidos. Gerado a partir do contrato em @sellmanager/shared.',
      license: { name: 'MIT', identifier: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3333', description: 'Desenvolvimento local' },
    ],
  });
}
