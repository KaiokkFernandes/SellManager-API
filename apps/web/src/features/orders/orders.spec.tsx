import type { Product } from '@sellmanager/api-client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  customer,
  errorResponse,
  order,
  page,
  product,
  signIn,
} from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';
const mouse: Product = {
  ...product,
  id: '9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d10',
  name: 'Mouse sem fio',
  price_cents: 12990,
  quantity: 1,
};

function mockCatalog() {
  server.use(
    http.get(`${API}/customers`, () => HttpResponse.json(page([customer]))),
    http.get(`${API}/customers/:id`, () => HttpResponse.json(customer)),
    http.get(`${API}/products`, ({ request }) => {
      const q = new URL(request.url).searchParams.get('q')?.toLowerCase() ?? '';
      return HttpResponse.json(
        page(
          [product, mouse].filter(item => item.name.toLowerCase().includes(q)),
        ),
      );
    }),
  );
}

async function pick(
  typing: ReturnType<typeof userEvent.setup>,
  comboboxName: string,
  option: string,
) {
  await typing.click(screen.getByRole('combobox', { name: comboboxName }));
  await typing.click(
    await screen.findByRole('option', { name: new RegExp(option) }),
  );
}

describe('Pedidos', () => {
  it('lista com cliente, itens e total; filtros de período e cliente vão para a URL', async () => {
    signIn();
    mockCatalog();
    const requests: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/orders`, ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json(page([order]));
      }),
    );
    const { router } = renderApp('/orders');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Pedidos' });
    expect(await within(table).findByText('Ana Souza')).toBeInTheDocument();
    expect(within(table).getByText('R$ 99,80')).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '2' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('De'), {
      target: { value: '2026-10-01' },
    });
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ from: '2026-10-01' }),
    );
    await waitFor(() =>
      expect(requests.at(-1)?.get('from')).toBe(
        new Date(2026, 9, 1).toISOString(),
      ),
    );

    await pick(typing, 'Filtrar por cliente', 'Ana Souza');
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        from: '2026-10-01',
        customer_id: customer.id,
      }),
    );
    expect(requests.at(-1)?.get('customer_id')).toBe(customer.id);

    const before = requests.length;
    fireEvent.change(screen.getByLabelText('Até'), {
      target: { value: '2026-09-01' },
    });
    expect(
      await screen.findByText(
        'A data final deve ser igual ou posterior à inicial.',
      ),
    ).toBeInTheDocument();
    expect(requests).toHaveLength(before);

    await typing.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
  });

  it('filtra por status (URL ↔ API) e mostra o badge de cada status', async () => {
    signIn();
    mockCatalog();
    const requests: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/orders`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        const status = params.get('status') ?? 'shipped';
        return HttpResponse.json(page([{ ...order, status }]));
      }),
    );
    const { router } = renderApp('/orders?status=paid');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Pedidos' });
    expect(await within(table).findByText('Pago')).toBeInTheDocument();
    expect(requests.at(-1)?.get('status')).toBe('paid');

    await typing.click(screen.getByRole('combobox', { name: 'Status' }));
    await typing.click(await screen.findByRole('option', { name: 'Enviado' }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ status: 'shipped' }),
    );
    expect(await within(table).findByText('Enviado')).toBeInTheDocument();
    expect(requests.at(-1)?.get('status')).toBe('shipped');

    // valor inválido na URL é ignorado
    await router.navigate({ to: '/orders', search: { status: 'x' as never } });
    await waitFor(() => expect(requests.at(-1)?.get('status')).toBeNull());
  });

  it('monta o pedido: soma item repetido, remove linha, total ao vivo e envia o schema do shared', async () => {
    signIn();
    mockCatalog();
    let body: unknown;
    server.use(
      http.post(`${API}/orders`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(order, { status: 201 });
      }),
      http.get(`${API}/orders/:id`, () => HttpResponse.json(order)),
    );
    const { router } = renderApp('/orders/new');
    const typing = userEvent.setup();

    await screen.findByRole('heading', { name: 'Novo pedido' });
    await pick(typing, 'Cliente', 'Ana Souza');
    await pick(typing, 'Adicionar produto', 'Cabo USB-C');
    await pick(typing, 'Adicionar produto', 'Mouse sem fio');
    await pick(typing, 'Adicionar produto', 'Cabo USB-C');

    const items = screen.getByRole('list', { name: 'Itens do pedido' });
    expect(within(items).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByLabelText('Quantidade de Cabo USB-C')).toHaveValue(2);
    // 2 × 49,90 + 1 × 129,90
    expect(screen.getByRole('status', { name: 'Total' })).toHaveTextContent(
      'R$ 229,70',
    );

    await typing.click(
      screen.getByRole('button', { name: 'Remover Mouse sem fio' }),
    );
    expect(within(items).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('status', { name: 'Total' })).toHaveTextContent(
      'R$ 99,80',
    );

    await typing.click(
      screen.getByRole('button', { name: 'Aumentar quantidade de Cabo USB-C' }),
    );
    expect(screen.getByRole('status', { name: 'Total' })).toHaveTextContent(
      'R$ 149,70',
    );

    await typing.click(screen.getByRole('button', { name: 'Criar pedido' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/orders/${order.id}`),
    );
    expect(body).toEqual({
      customer_id: customer.id,
      products: [{ id: product.id, quantity: 3 }],
    });
  });

  it('valida com o schema do shared: cliente e ao menos um item', async () => {
    signIn();
    mockCatalog();
    renderApp('/orders/new');
    const typing = userEvent.setup();

    await typing.click(
      await screen.findByRole('button', { name: 'Criar pedido' }),
    );

    expect(
      await screen.findByText('Adicione ao menos um item'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('avisa acima do estoque conhecido e aponta a linha no erro de estoque da API', async () => {
    signIn();
    mockCatalog();
    server.use(
      http.post(`${API}/orders`, () =>
        errorResponse(409, 'INSUFFICIENT_STOCK', 'Insufficient stock', {
          details: [{ product_id: product.id, available: 4, requested: 5 }],
        }),
      ),
    );
    renderApp(`/orders/new?customer_id=${customer.id}`);
    const typing = userEvent.setup();

    // cliente pré-selecionado pela URL
    const customerField = await screen.findByRole('combobox', {
      name: 'Cliente',
    });
    await waitFor(() => expect(customerField).toHaveTextContent('Ana Souza'));

    await pick(typing, 'Adicionar produto', 'Mouse sem fio');
    await typing.click(
      screen.getByRole('button', {
        name: 'Aumentar quantidade de Mouse sem fio',
      }),
    );
    expect(
      screen.getByText('Acima do estoque conhecido (1 disponível(is)).'),
    ).toBeInTheDocument();
    await typing.click(
      screen.getByRole('button', { name: 'Remover Mouse sem fio' }),
    );

    await pick(typing, 'Adicionar produto', 'Cabo USB-C');
    const quantity = screen.getByLabelText('Quantidade de Cabo USB-C');
    await typing.clear(quantity);
    await typing.type(quantity, '5');
    await typing.click(screen.getByRole('button', { name: 'Criar pedido' }));

    expect(
      await screen.findByText('Estoque insuficiente: só há 4 disponível(is).'),
    ).toBeInTheDocument();
    expect(quantity).toBeInvalid();
    expect(quantity).toHaveAccessibleDescription(/só há 4/);
    expect(
      screen.getByText(/Ajuste as quantidades destacadas/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar pedido' })).toBeEnabled();
  });

  it('detalhe mostra itens a preço da compra e cancela com motivo', async () => {
    signIn();
    let status = 'pending';
    let sentBody: unknown;
    server.use(
      http.get(`${API}/orders/:id`, () =>
        HttpResponse.json({ ...order, status }),
      ),
      http.patch(`${API}/orders/:id/cancel`, async ({ request }) => {
        sentBody = await request.json();
        status = 'canceled';
        return HttpResponse.json({ ...order, status });
      }),
    );
    renderApp(`/orders/${order.id}`);
    const typing = userEvent.setup();

    const items = await screen.findByRole('table', { name: /Itens do pedido/ });
    const row = within(items).getByRole('row', { name: /Cabo USB-C/ });
    expect(within(row).getByText('R$ 49,90')).toBeInTheDocument();
    expect(within(row).getByText('R$ 99,80')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ana Souza' })).toHaveAttribute(
      'href',
      `/customers/${customer.id}`,
    );

    await typing.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Cancelar pedido?',
    });
    const confirm = within(dialog).getByRole('button', {
      name: 'Cancelar pedido',
    });
    // sem motivo: o schema do shared barra antes de chamar a API
    await typing.click(confirm);
    const reason = within(dialog).getByLabelText('Motivo do cancelamento');
    await waitFor(() => expect(reason).toBeInvalid());
    expect(status).toBe('pending');

    await typing.type(reason, 'Cliente desistiu');
    await typing.click(confirm);

    expect(
      await screen.findByText(
        'Pedido cancelado. Os itens voltaram ao estoque.',
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Registrar pagamento' }),
      ).not.toBeInTheDocument(),
    );
    expect(sentBody).toEqual({ reason: 'Cliente desistiu' });
  });
});
