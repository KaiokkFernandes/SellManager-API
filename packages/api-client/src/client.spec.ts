import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, createApiClient, unwrap, type Product } from './index';

const product = {
  id: '5c301fd4-233e-4eac-bb22-994b162e70d2',
  name: 'Teclado',
  price_cents: 19990,
  quantity: 10,
  image_url: null,
  created_at: '2026-10-24T20:00:00.000Z',
  updated_at: '2026-10-24T20:00:00.000Z',
} satisfies Product;

function fakeFetch(status: number, body?: unknown) {
  const calls: Request[] = [];
  const fetch = vi.fn((input: Request) => {
    calls.push(input);
    return Promise.resolve(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

describe('createApiClient', () => {
  it('usa a baseUrl e injeta o token JWT', async () => {
    const { fetch, calls } = fakeFetch(200, product);
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getToken: () => 'abc',
      fetch,
    });

    const data = await unwrap(
      client.GET('/products/{id}', { params: { path: { id: product.id } } }),
    );

    expect(data.price_cents).toBe(19990);
    expect(calls[0]?.url).toBe(`http://api.test/products/${product.id}`);
    expect(calls[0]?.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('não envia Authorization sem token', async () => {
    const { fetch, calls } = fakeFetch(200, {
      data: [],
      meta: { page: 1, limit: 20, total: 0, total_pages: 0 },
    });
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getToken: () => null,
      fetch,
    });

    await unwrap(client.GET('/products'));

    expect(calls[0]?.headers.has('Authorization')).toBe(false);
  });

  it('chama onUnauthorized no 401 de requisição autenticada', async () => {
    const onUnauthorized = vi.fn();
    const { fetch } = fakeFetch(401, {
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Invalid JWT token',
    });
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getToken: () => 'expirado',
      onUnauthorized,
      fetch,
    });

    await expect(unwrap(client.GET('/profile'))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('não chama onUnauthorized no login com senha errada', async () => {
    const onUnauthorized = vi.fn();
    const { fetch } = fakeFetch(401, {
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Incorrect email/password combination.',
    });
    const client = createApiClient({
      baseUrl: 'http://api.test',
      onUnauthorized,
      fetch,
    });

    await expect(
      unwrap(
        client.POST('/sessions', { body: { email: 'a@b.com', password: 'x' } }),
      ),
    ).rejects.toBeInstanceOf(ApiClientError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('expõe code, issues e erros por campo do formato padrão', async () => {
    const { fetch } = fakeFetch(400, {
      status: 'error',
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      issues: [
        { segment: 'body', path: 'email', message: 'Invalid email address' },
      ],
    });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const error = await unwrap(
      client.POST('/customers', { body: { name: 'Ana', email: 'x' } }),
    ).then(
      () => {
        throw new Error('deveria falhar');
      },
      (caught: unknown) => caught as ApiClientError,
    );

    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fieldErrors).toEqual({
      'body.email': 'Invalid email address',
    });
  });

  it('trata falha de rede como NETWORK_ERROR', async () => {
    const fetch = vi.fn(() => Promise.reject(new TypeError('fetch failed')));
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetch: fetch,
    });

    await expect(unwrap(client.GET('/products'))).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('uploadAvatar envia multipart com o arquivo no campo avatar', async () => {
    const { fetch, calls } = fakeFetch(200, {
      ...product,
      email: 'k@test.com',
      avatar: 'a.png',
      avatar_url: 'http://api.test/files/a.png',
    });
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getToken: () => 'abc',
      fetch,
    });

    await client.uploadAvatar(
      new Blob(['png'], { type: 'image/png' }),
      'a.png',
    );

    const request = calls[0];
    expect(request.method).toBe('PATCH');
    expect(request.headers.get('Content-Type')).toMatch(
      /^multipart\/form-data; boundary=/,
    );
    const form = await request.formData();
    expect((form.get('avatar') as File).name).toBe('a.png');
  });
});
