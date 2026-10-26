import createClient, { type Client, type Middleware } from 'openapi-fetch';
import { ApiClientError } from './errors';
import type { components, paths } from './generated/openapi';

export interface ApiClientOptions {
  /** URL base da API, ex.: http://localhost:3333 */
  baseUrl: string;
  /** Token JWT atual (ou null se não autenticado). Chamado a cada requisição. */
  getToken?: () => string | null | undefined;
  /**
   * Chamado quando uma requisição autenticada recebe 401 (token expirado ou
   * inválido). O app decide o que fazer, ex.: limpar o token e ir para o login.
   * Não é chamado em login com senha errada (requisição sem token).
   */
  onUnauthorized?: (response: Response) => void;
  /** fetch alternativo (testes, SSR). */
  fetch?: typeof globalThis.fetch;
}

export type SellManagerClient = Client<paths> & {
  /** PATCH /users/avatar com multipart/form-data. */
  uploadAvatar(
    file: Blob,
    filename?: string,
  ): Promise<components['schemas']['User']>;
};

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  fetch,
}: ApiClientOptions): SellManagerClient {
  const client = createClient<paths>({ baseUrl, ...(fetch && { fetch }) });

  const auth: Middleware = {
    onRequest({ request }) {
      const token = getToken?.();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
      return request;
    },
    onResponse({ request, response }) {
      if (response.status === 401 && request.headers.has('Authorization')) {
        onUnauthorized?.(response);
      }
      return response;
    },
  };
  client.use(auth);

  return Object.assign(client, {
    async uploadAvatar(file: Blob, filename = 'avatar') {
      return unwrap(
        client.PATCH('/users/avatar', {
          // o tipo gerado para arquivo binário é string; o corpo real é o FormData
          body: { avatar: '' },
          bodySerializer: () => {
            const form = new FormData();
            form.append('avatar', file, filename);
            return form;
          },
        }),
      );
    },
  });
}

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Devolve `data` ou lança `ApiClientError` com o erro padrão da API tipado.
 * Para respostas 204 devolve `undefined`.
 */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await request;
  } catch (cause) {
    throw Object.assign(new ApiClientError(0, undefined), { cause });
  }

  if (!result.response.ok) {
    throw new ApiClientError(result.response.status, result.error);
  }
  return result.data as T;
}
