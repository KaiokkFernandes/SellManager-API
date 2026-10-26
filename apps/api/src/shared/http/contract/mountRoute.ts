import { RequestHandler, Response, Router } from 'express';
import type {
  RouteDefinition,
  RouteInput,
  RouteResponseBody,
  RouteSuccessStatus,
} from '@sellmanager/shared';
import { validate } from '../middlewares/validate';
import { checkResponse, ResponseValidationMode } from './responseValidation';

type ReplyArgs<R extends RouteDefinition, S extends RouteSuccessStatus<R>> =
  RouteResponseBody<R, S> extends undefined
    ? []
    : [body: RouteResponseBody<R, S>];

export interface RouteContext<R extends RouteDefinition> {
  /** params/query/body já validados e convertidos pelos schemas da rota. */
  input: RouteInput<R>;
  request: Express.Request & { user: { id: string } };
  /**
   * Envia a resposta. O corpo é tipado pelo schema daquele status no
   * contrato: mudar um DTO no shared quebra a compilação aqui.
   */
  reply: <S extends RouteSuccessStatus<R>>(
    status: S,
    ...body: ReplyArgs<R, S>
  ) => void;
}

export type RouteHandler<R extends RouteDefinition> = (
  context: RouteContext<R>,
) => Promise<void>;

export interface RouteMounterOptions {
  authenticated: RequestHandler;
  rateLimiter: RequestHandler;
  responseValidation: ResponseValidationMode;
}

export type MountRoute = <R extends RouteDefinition>(
  route: R,
  handler: RouteHandler<R>,
  ...middlewares: RequestHandler[]
) => void;

/** `/products/{id}` (OpenAPI) -> `/products/:id` (Express). */
export function toExpressPath(path: string): string {
  return path.replace(/\{(\w+)\}/g, ':$1');
}

/**
 * Registra no router uma rota do contrato: método, path, rate limit, auth,
 * validação da entrada e (fora de produção) da resposta, tudo derivado da
 * definição. Os middlewares extras (ex.: multer) rodam antes da validação.
 */
export function createRouteMounter(
  router: Router,
  { authenticated, rateLimiter, responseValidation }: RouteMounterOptions,
): MountRoute {
  return (route, handler, ...middlewares) => {
    const chain: RequestHandler[] = [];
    if (route.rateLimited) chain.push(rateLimiter);
    if (route.auth) chain.push(authenticated);
    chain.push(...middlewares, validate(route.request));

    router[route.method](
      toExpressPath(route.path),
      ...chain,
      async (request, response) => {
        const reply = (status: number, body?: unknown) =>
          send(route, response, status, body, responseValidation);

        await handler({
          input: {
            params: request.params,
            query: request.query,
            body: request.body as unknown,
          } as RouteInput<typeof route>,
          request,
          reply,
        });
      },
    );
  };
}

function send(
  route: RouteDefinition,
  response: Response,
  status: number,
  body: unknown,
  mode: ResponseValidationMode,
): void {
  const schema = route.responses[status as keyof typeof route.responses];

  if (schema === undefined) {
    throw new Error(
      `${route.operationId} não declara resposta ${status} no contrato`,
    );
  }

  if (schema === null) {
    response.status(status).send();
    return;
  }

  checkResponse(schema, body, { operationId: route.operationId, status }, mode);
  response.status(status).json(body);
}
