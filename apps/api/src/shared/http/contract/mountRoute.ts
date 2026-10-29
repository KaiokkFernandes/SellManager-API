import { RequestHandler, Response, Router } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { logger } from '@shared/logger';
import type {
  RouteDefinition,
  RouteInput,
  RouteResponseBody,
  RouteSuccessStatus,
} from '@sellmanager/shared';
import { authorize } from '../middlewares/authorize';
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
  /**
   * Rotas com `download` no contrato: envia o arquivo em streaming (linhas
   * geradas aos poucos, memória constante). Erro no meio corta a conexão.
   */
  download: (file: {
    filename: string;
    content: AsyncIterable<string>;
  }) => Promise<void>;
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
 * permissão,
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
    // permissão antes do upload e da validação: quem não pode não descobre nada
    if (route.auth && route.permission !== 'authenticated') {
      chain.push(authorize(route.permission));
    }
    chain.push(...middlewares, validate(route.request));

    router[route.method](
      toExpressPath(route.path),
      ...chain,
      async (request, response) => {
        const reply = (status: number, body?: unknown) =>
          send(route, response, status, body, responseValidation);
        const download = (file: {
          filename: string;
          content: AsyncIterable<string>;
        }) => stream(route, response, file);

        await handler({
          input: {
            params: request.params,
            query: request.query,
            body: request.body as unknown,
          } as RouteInput<typeof route>,
          request,
          reply,
          download,
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

async function stream(
  route: RouteDefinition,
  response: Response,
  { filename, content }: { filename: string; content: AsyncIterable<string> },
): Promise<void> {
  if (!route.download) {
    throw new Error(`${route.operationId} não declara download no contrato`);
  }
  // o primeiro pedaço sai antes dos headers: se a consulta falhar já no
  // início, o erro ainda vira a resposta JSON padrão (500)
  const iterator = content[Symbol.asyncIterator]();
  const first = await iterator.next();

  response.status(200);
  response.setHeader(
    'Content-Type',
    `${route.download.contentType}; charset=utf-8`,
  );
  response.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  response.setHeader('Cache-Control', 'no-store');

  async function* rest() {
    if (!first.done) yield first.value;
    for (;;) {
      const next = await iterator.next();
      if (next.done) return;
      yield next.value;
    }
  }
  try {
    // se o cliente desistir, o pipeline encerra o gerador (e ele fecha o cursor)
    await pipeline(Readable.from(rest()), response);
  } catch (error) {
    // depois do primeiro byte não dá mais para responder com JSON de erro
    logger.error(
      { err: error, operationId: route.operationId },
      'download interrompido',
    );
    await iterator.return?.();
    response.destroy();
  }
}
