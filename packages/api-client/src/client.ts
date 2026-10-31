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
  /** XMLHttpRequest alternativo (testes). Usado só nos uploads com progresso. */
  XMLHttpRequest?: typeof globalThis.XMLHttpRequest;
}

export interface UploadOptions {
  /** Fração enviada, de 0 a 1. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export type SellManagerClient = Client<paths> & {
  /** PATCH /users/avatar com multipart/form-data. */
  uploadAvatar(
    file: Blob,
    filename?: string,
  ): Promise<components['schemas']['User']>;
  /**
   * PATCH /products/{id}/image com multipart/form-data e progresso de envio
   * (via XMLHttpRequest: fetch não informa progresso de upload).
   */
  uploadProductImage(
    id: string,
    file: Blob,
    options?: UploadOptions & { filename?: string },
  ): Promise<components['schemas']['Product']>;
};

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  fetch,
  XMLHttpRequest: Xhr,
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

    uploadProductImage(
      id: string,
      file: Blob,
      {
        filename = 'image',
        ...options
      }: UploadOptions & { filename?: string } = {},
    ) {
      const form = new FormData();
      form.append('image', file, filename);
      return sendMultipart<components['schemas']['Product']>({
        Xhr: Xhr ?? globalThis.XMLHttpRequest,
        url: `${baseUrl}/products/${encodeURIComponent(id)}/image`,
        method: 'PATCH',
        body: form,
        token: getToken?.(),
        onUnauthorized,
        ...options,
      });
    },
  });
}

interface MultipartRequest extends UploadOptions {
  Xhr: typeof globalThis.XMLHttpRequest;
  url: string;
  method: string;
  body: FormData;
  token: string | null | undefined;
  onUnauthorized?: (response: Response) => void;
}

function sendMultipart<T>({
  Xhr,
  url,
  method,
  body,
  token,
  onUnauthorized,
  onProgress,
  signal,
}: MultipartRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new Xhr();
    xhr.open(method, url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    });
    xhr.addEventListener('load', () => {
      let parsed: unknown;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        parsed = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve(parsed as T);
        return;
      }
      if (xhr.status === 401 && token) {
        onUnauthorized?.(new Response(null, { status: 401 }));
      }
      reject(new ApiClientError(xhr.status, parsed));
    });
    const fail = (cause: string) => () =>
      reject(Object.assign(new ApiClientError(0, undefined), { cause }));
    xhr.addEventListener('error', fail('network'));
    xhr.addEventListener('abort', fail('aborted'));

    if (signal) {
      if (signal.aborted) {
        fail('aborted')();
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(body);
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

export interface DownloadedFile {
  blob: Blob;
  /** Nome sugerido pela API (Content-Disposition), se houver. */
  filename: string | undefined;
}

/** Nome do arquivo do Content-Disposition (prefere o `filename*` em UTF-8). */
export function filenameFrom(disposition: string | null): string | undefined {
  if (!disposition) return undefined;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return /filename="([^"]+)"/i.exec(disposition)?.[1];
}

/**
 * Como `unwrap`, para rotas de download (chame com `parseAs: 'blob'`): devolve
 * o arquivo e o nome; erro da API vira ApiClientError com o JSON de erro.
 */
export async function unwrapFile(
  request: Promise<FetchResult<unknown>>,
): Promise<DownloadedFile> {
  let result: FetchResult<unknown>;
  try {
    result = await request;
  } catch (cause) {
    throw Object.assign(new ApiClientError(0, undefined), { cause });
  }
  if (!result.response.ok) {
    throw new ApiClientError(result.response.status, result.error);
  }
  return {
    blob: result.data as Blob,
    filename: filenameFrom(result.response.headers.get('Content-Disposition')),
  };
}
