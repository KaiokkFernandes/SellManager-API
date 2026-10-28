import type { StockMovement } from '@sellmanager/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  category,
  page,
  product,
  productDetailHandler,
  signIn,
} from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';

const initial: StockMovement = {
  id: 'd3000000-0000-4000-8000-000000000001',
  product_id: product.id,
  type: 'INITIAL',
  quantity: 10,
  balance_after: 10,
  reason: null,
  order_id: null,
  created_by: { id: 'u1000000-0000-4000-8000-000000000001', name: 'Vera' },
  created_at: '2026-10-01T12:00:00.000Z',
};

function mockProduct() {
  const movements: StockMovement[] = [initial];
  const posted: unknown[] = [];
  server.use(
    productDetailHandler(product),
    http.get(`${API}/categories`, () => HttpResponse.json(page([category]))),
    http.get(`${API}/products/:id/stock-movements`, () =>
      HttpResponse.json(page([...movements].reverse())),
    ),
    http.post(`${API}/products/:id/stock-movements`, async ({ request }) => {
      const body = (await request.json()) as {
        type: 'ENTRY' | 'ADJUSTMENT';
        quantity: number;
        reason?: string;
      };
      posted.push(body);
      const movement: StockMovement = {
        ...initial,
        id: `d3000000-0000-4000-8000-00000000000${movements.length + 1}`,
        type: body.type,
        quantity: body.quantity,
        balance_after: (movements.at(-1)?.balance_after ?? 0) + body.quantity,
        reason: body.reason ?? null,
      };
      movements.push(movement);
      return HttpResponse.json(movement, { status: 201 });
    }),
  );
  return posted;
}

describe('Estoque no produto', () => {
  it('aba Movimentações (na URL) e ajuste manual com motivo obrigatório', async () => {
    signIn('MANAGER');
    const posted = mockProduct();
    const { router } = renderApp(`/products/${product.id}/edit`);
    const typing = userEvent.setup();

    await typing.click(
      await screen.findByRole('tab', { name: 'Movimentações' }),
    );
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'movements' }),
    );
    const table = await screen.findByRole('table', {
      name: 'Movimentações de estoque',
    });
    expect(
      await within(table).findByRole('row', {
        name: /Saldo inicial.*\+10.*10/,
      }),
    ).toBeInTheDocument();

    await typing.click(screen.getByRole('button', { name: 'Ajustar estoque' }));
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Ajustar estoque',
    });
    await typing.click(within(dialog).getByRole('combobox', { name: 'Tipo' }));
    await typing.click(
      await screen.findByRole('option', { name: 'Ajuste manual (±)' }),
    );
    await typing.type(within(dialog).getByLabelText('Quantidade'), '-2');
    await typing.click(
      within(dialog).getByRole('button', { name: 'Registrar' }),
    );
    // o schema do shared barra o ajuste sem motivo, antes da API
    expect(await within(dialog).findByText('Informe o motivo')).toBeVisible();
    expect(posted).toHaveLength(0);

    await typing.type(within(dialog).getByLabelText('Motivo'), 'Avaria');
    await typing.click(
      within(dialog).getByRole('button', { name: 'Registrar' }),
    );

    expect(await screen.findByText('Ajuste registrado.')).toBeInTheDocument();
    expect(posted).toEqual([
      { type: 'ADJUSTMENT', quantity: -2, reason: 'Avaria' },
    ]);
    expect(
      await within(table).findByRole('row', {
        name: /Ajuste manual.*-2.*8.*Avaria/,
      }),
    ).toBeInTheDocument();
  });

  it('entrada negativa é barrada pelo schema', async () => {
    signIn('MANAGER');
    const posted = mockProduct();
    renderApp(`/products/${product.id}/edit?tab=movements`);
    const typing = userEvent.setup();

    await typing.click(
      await screen.findByRole('button', { name: 'Ajustar estoque' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    await typing.type(within(dialog).getByLabelText('Quantidade'), '-1');
    await typing.click(
      within(dialog).getByRole('button', { name: 'Registrar' }),
    );
    expect(
      await within(dialog).findByText('A entrada deve ter quantidade positiva'),
    ).toBeVisible();
    expect(posted).toHaveLength(0);
  });

  it('cadastro envia categoria e estoque mínimo', async () => {
    signIn();
    let body: unknown;
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json(page([category]))),
      http.post(`${API}/products`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(product, { status: 201 });
      }),
      productDetailHandler(product),
      http.get(`${API}/products/:id/stock-movements`, () =>
        HttpResponse.json(page([initial])),
      ),
    );
    renderApp('/products/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), 'Cabo');
    await typing.type(screen.getByLabelText('Preço'), '10');
    await typing.type(screen.getByLabelText('Estoque inicial'), '4');
    await typing.clear(screen.getByLabelText('Estoque mínimo'));
    await typing.type(screen.getByLabelText('Estoque mínimo'), '5');
    await typing.click(screen.getByRole('combobox', { name: 'Categoria' }));
    await typing.click(await screen.findByRole('option', { name: 'Cabos' }));
    await typing.click(
      screen.getByRole('button', { name: 'Cadastrar produto' }),
    );

    await waitFor(() =>
      expect(body).toEqual({
        name: 'Cabo',
        price_cents: 1000,
        quantity: 4,
        category_id: category.id,
        min_stock: 5,
      }),
    );
  });

  it('lista filtra por categoria (URL ↔ API) e mostra a coluna', async () => {
    signIn();
    const requests: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json(page([category]))),
      http.get(`${API}/products`, ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json(page([{ ...product, category }]));
      }),
    );
    const { router } = renderApp('/products');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Produtos' });
    expect(await within(table).findByText('Cabos')).toBeInTheDocument();
    await typing.click(screen.getByRole('combobox', { name: 'Categoria' }));
    await typing.click(await screen.findByRole('option', { name: 'Cabos' }));

    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        category_id: category.id,
      }),
    );
    await waitFor(() =>
      expect(requests.at(-1)?.get('category_id')).toBe(category.id),
    );
  });

  it('SELLER não vê a aba de movimentações (nem edita produto)', async () => {
    signIn('SELLER');
    mockProduct();
    renderApp(`/products/${product.id}/edit?tab=movements`);

    expect(
      await screen.findByRole('heading', { name: 'Acesso não permitido' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
