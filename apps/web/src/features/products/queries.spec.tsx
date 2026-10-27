import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page, product } from '@/test/fixtures';
import { server } from '@/test/server';
import { useCreateProduct, useDeleteProduct, useProductsList } from './queries';

const API = 'http://api.test';

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('hooks de produtos (modelo)', () => {
  it('lista com a paginação do contrato', async () => {
    server.use(
      http.get(`${API}/products`, () => HttpResponse.json(page([product], 21))),
    );
    const { wrapper } = setup();

    const { result } = renderHook(
      () => useProductsList({ page: 1, limit: 20 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.meta.total).toBe(21);
    expect(result.current.data?.data[0]?.price_cents).toBe(4990);
  });

  it('criar invalida a lista, que é buscada de novo', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/products`, () => {
        calls += 1;
        return HttpResponse.json(page([product]));
      }),
      http.post(`${API}/products`, () =>
        HttpResponse.json(product, { status: 201 }),
      ),
    );
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        list: useProductsList({ page: 1, limit: 20 }),
        create: useCreateProduct(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    result.current.create.mutate({
      name: 'Cabo',
      price_cents: 4990,
      quantity: 10,
    });

    await waitFor(() => expect(calls).toBe(2));
  });

  it('excluir (204) invalida a lista', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/products`, () => {
        calls += 1;
        return HttpResponse.json(page([product]));
      }),
      http.delete(
        `${API}/products/${product.id}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        list: useProductsList({ page: 1, limit: 20 }),
        remove: useDeleteProduct(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    result.current.remove.mutate(product.id);

    await waitFor(() => expect(calls).toBe(2));
  });
});
