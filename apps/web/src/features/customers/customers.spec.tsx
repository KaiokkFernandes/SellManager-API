import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  customer,
  errorResponse,
  makeCustomer,
  order,
  page,
  signIn,
} from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';

/** GET /customers que filtra por `q` e registra as query strings recebidas. */
function mockCustomersList() {
  const all = [
    customer,
    ...Array.from({ length: 24 }, (_, index) => makeCustomer(index + 1)),
  ];
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/customers`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const q = params.get('q')?.toLowerCase() ?? '';
      const found = all.filter(item => item.name.toLowerCase().includes(q));
      const pageNumber = Number(params.get('page') ?? 1);
      return HttpResponse.json({
        data: found.slice((pageNumber - 1) * 20, pageNumber * 20),
        meta: {
          page: pageNumber,
          limit: 20,
          total: found.length,
          total_pages: Math.ceil(found.length / 20),
        },
      });
    }),
  );
  return requests;
}

describe('Clientes', () => {
  it('lista, busca com debounce e reflete busca/ordenação/página na URL', async () => {
    signIn();
    const requests = mockCustomersList();
    const { router } = renderApp('/customers');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Clientes' });
    expect(
      await within(table).findByRole('link', { name: 'Ana Souza' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2 · 25 itens')).toBeInTheDocument();

    await typing.type(
      screen.getByRole('searchbox', { name: 'Buscar por nome ou e-mail' }),
      'ana',
    );
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ q: 'ana' }),
    );
    await waitFor(() => expect(requests.at(-1)?.get('q')).toBe('ana'));
    expect(
      await screen.findByText('Página 1 de 1 · 1 item'),
    ).toBeInTheDocument();

    await typing.click(within(table).getByRole('button', { name: /E-mail/ }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        q: 'ana',
        sort: 'email',
        order: 'asc',
      }),
    );
    expect(requests.at(-1)?.get('sort')).toBe('email');
  });

  it('a URL compartilhada restaura o estado (página 2)', async () => {
    signIn();
    const requests = mockCustomersList();
    renderApp('/customers?page=2&sort=name&order=desc');

    expect(
      await screen.findByText('Página 2 de 2 · 25 itens'),
    ).toBeInTheDocument();
    expect(requests[0]?.get('page')).toBe('2');
    expect(requests[0]?.get('order')).toBe('desc');
  });

  it('estado vazio tem chamada para cadastrar o primeiro cliente', async () => {
    signIn();
    server.use(http.get(`${API}/customers`, () => HttpResponse.json(page([]))));
    renderApp('/customers');

    expect(
      await screen.findByText('Nenhum cliente cadastrado ainda.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Cadastrar o primeiro cliente' }),
    ).toHaveAttribute('href', '/customers/new');
  });

  it('erro na listagem permite tentar de novo', async () => {
    signIn();
    let fail = true;
    server.use(
      http.get(`${API}/customers`, () =>
        fail
          ? errorResponse(500, 'INTERNAL_ERROR', 'boom')
          : HttpResponse.json(page([customer])),
      ),
    );
    renderApp('/customers');
    const [alert] = await screen.findAllByRole('alert');
    expect(alert).toHaveTextContent('Algo deu errado no servidor');

    fail = false;
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Tentar de novo' })[0],
    );
    expect(
      (await screen.findAllByRole('link', { name: 'Ana Souza' }))[0],
    ).toBeInTheDocument();
  });

  it('cria um cliente e abre o detalhe', async () => {
    signIn();
    let body: unknown;
    server.use(
      http.post(`${API}/customers`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(customer, { status: 201 });
      }),
      http.get(`${API}/customers/${customer.id}`, () =>
        HttpResponse.json(customer),
      ),
      http.get(`${API}/orders`, () => HttpResponse.json(page([order]))),
    );
    const { router } = renderApp('/customers/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), '  Ana Souza ');
    await typing.type(screen.getByLabelText('E-mail'), 'ANA@example.com');
    await typing.click(
      screen.getByRole('button', { name: 'Cadastrar cliente' }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/customers/${customer.id}`),
    );
    // o schema do shared já normaliza antes de enviar
    expect(body).toEqual({ name: 'Ana Souza', email: 'ana@example.com' });
    expect(
      await screen.findByRole('heading', { name: 'Ana Souza' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Cliente cadastrado.')).toBeInTheDocument();
    // detalhe com os pedidos do cliente
    const orders = await screen.findByRole('table', {
      name: 'Pedidos de Ana Souza',
    });
    expect(await within(orders).findByText('R$ 99,80')).toBeInTheDocument();
  });

  it('e-mail duplicado (409 da API) aparece no campo', async () => {
    signIn();
    server.use(
      http.post(`${API}/customers`, () =>
        errorResponse(409, 'ALREADY_EXISTS', 'Email already in use', {
          issues: [
            { segment: 'body', path: 'email', message: 'Email already in use' },
          ],
        }),
      ),
    );
    renderApp('/customers/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), 'Ana');
    await typing.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await typing.click(
      screen.getByRole('button', { name: 'Cadastrar cliente' }),
    );

    expect(
      await screen.findByText('Já está em uso por outro cadastro.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInvalid();
    expect(
      screen.getByRole('button', { name: 'Cadastrar cliente' }),
    ).toBeEnabled();
  });

  it('confirma antes de sair do formulário com alterações', async () => {
    signIn();
    mockCustomersList();
    const { router } = renderApp('/customers/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), 'Rascunho');
    await typing.click(screen.getByRole('button', { name: 'Cancelar' }));

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Descartar alterações?',
    });
    await typing.click(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    );
    expect(router.state.location.pathname).toBe('/customers/new');
    expect(screen.getByLabelText('Nome')).toHaveValue('Rascunho');

    await typing.click(screen.getByRole('button', { name: 'Cancelar' }));
    await typing.click(
      await screen.findByRole('button', { name: 'Sair sem salvar' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/customers'),
    );
  });

  it('exclui após confirmar e explica a recusa quando há pedidos', async () => {
    signIn();
    mockCustomersList();
    const deleted: string[] = [];
    server.use(
      http.delete(`${API}/customers/:id`, ({ params }) => {
        if (params.id === customer.id) {
          return errorResponse(
            409,
            'RESOURCE_IN_USE',
            'Customer has orders and cannot be deleted',
            {
              details: { orders_count: 3 },
            },
          );
        }
        deleted.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/customers');
    const typing = userEvent.setup();
    const table = await screen.findByRole('table', { name: 'Clientes' });

    await typing.click(
      await within(table).findByRole('button', { name: 'Excluir Cliente 1' }),
    );
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Excluir Cliente 1?',
    });
    await typing.click(
      within(confirm).getByRole('button', { name: 'Excluir' }),
    );
    await waitFor(() => expect(deleted).toEqual([makeCustomer(1).id]));
    expect(await screen.findByText('Cliente excluído.')).toBeInTheDocument();

    await typing.click(
      within(table).getByRole('button', { name: 'Excluir Ana Souza' }),
    );
    await typing.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Excluir',
      }),
    );
    expect(
      await screen.findByText(/tem 3 pedidos e não pode ser excluído/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('alertdialog', { name: 'Não é possível excluir' }),
    ).toBeInTheDocument();
  });
});
