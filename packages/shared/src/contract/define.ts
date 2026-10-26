import type { z } from 'zod';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type SuccessStatus = 200 | 201 | 204;
export type ErrorStatus = 400 | 401 | 404 | 409 | 413 | 429 | 500;

export interface RouteRequest {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
  /** `multipart` = upload de arquivo; o corpo não é validado como JSON. */
  bodyType?: 'json' | 'multipart';
}

export interface RouteConfig {
  method: HttpMethod;
  /** Path no formato OpenAPI: `/products/{id}`. */
  path: `/${string}`;
  operationId: string;
  summary: string;
  description?: string;
  tags: readonly string[];
  /** Exige `Authorization: Bearer <token>`. */
  auth: boolean;
  /** Sujeita ao rate limit das rotas de autenticação. */
  rateLimited?: boolean;
  request?: RouteRequest;
  /** Respostas de sucesso; `null` = sem corpo (204). */
  responses: Partial<Record<SuccessStatus, z.ZodType | null>>;
  /** Erros de domínio (404, 409…). 400, 401, 413, 429 e 500 são deduzidos. */
  errors?: readonly ErrorStatus[];
}

export type RouteDefinition<C extends RouteConfig = RouteConfig> = C & {
  /** Todos os status de erro possíveis da rota, já deduzidos. */
  readonly errorStatuses: readonly ErrorStatus[];
};

/**
 * Declara uma rota do contrato. Os erros automáticos saem da própria
 * configuração: 400 se há entrada, 413 se há corpo JSON, 401 se exige auth,
 * 429 se tem rate limit e 500 sempre.
 */
export function defineRoute<const C extends RouteConfig>(
  config: C,
): RouteDefinition<C> {
  const errors = new Set<ErrorStatus>(config.errors ?? []);
  const { params, query, body } = config.request ?? {};

  if (params || query || body) errors.add(400);
  if (body && config.request?.bodyType !== 'multipart') errors.add(413);
  if (config.auth) errors.add(401);
  if (config.rateLimited) errors.add(429);
  errors.add(500);

  return { ...config, errorStatuses: [...errors].sort((a, b) => a - b) };
}

export const ERROR_DESCRIPTIONS: Record<ErrorStatus, string> = {
  400: 'Dados inválidos',
  401: 'Não autenticado ou credenciais inválidas',
  404: 'Recurso não encontrado',
  409: 'Conflito com o estado atual',
  413: 'Payload grande demais',
  429: 'Muitas requisições',
  500: 'Erro interno',
};

// ---- Tipos derivados de uma rota

type SchemaOf<R extends RouteConfig, K extends keyof RouteRequest> =
  R['request'] extends Record<K, infer S extends z.ZodType> ? S : never;

/** Entrada já validada (saída do zod: com trim, coerção, defaults). */
export type RouteInput<R extends RouteConfig> = {
  params: [SchemaOf<R, 'params'>] extends [never]
    ? Record<string, never>
    : z.output<SchemaOf<R, 'params'>>;
  query: [SchemaOf<R, 'query'>] extends [never]
    ? Record<string, never>
    : z.output<SchemaOf<R, 'query'>>;
  body: [SchemaOf<R, 'body'>] extends [never]
    ? undefined
    : z.output<SchemaOf<R, 'body'>>;
};

export type RouteSuccessStatus<R extends RouteConfig> = Extract<
  keyof R['responses'],
  SuccessStatus
>;

/** Corpo esperado na resposta `S` da rota (undefined = sem corpo). */
export type RouteResponseBody<
  R extends RouteConfig,
  S extends RouteSuccessStatus<R>,
> = R['responses'][S] extends z.ZodType
  ? z.input<R['responses'][S]>
  : undefined;
