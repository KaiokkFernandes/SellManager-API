import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  customer,
  order,
  orderDetails,
  orderWith,
  page,
  product,
  signIn,
} from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';
import type { OrderStatus, Role } from '@sellmanager/shared';

const API = 'http://api.test';

function mockLists() {
  server.use(
    http.get(`${API}/products`, () => HttpResponse.json(page([product]))),
    http.get(`${API}/customers`, () => HttpResponse.json(page([customer]))),
    http.get(`${API}/orders`, () => HttpResponse.json(page([order]))),
    http.get(`${API}/orders/:id`, () => HttpResponse.json(orderDetails)),
    http.get(`${API}/users`, () => HttpResponse.json(page([]))),
  );
}

async function menuLabels() {
  const [nav] = await screen.findAllByRole('navigation', { name: 'Principal' });
  return within(nav)
    .getAllByRole('link')
    .map(link => link.textContent);
}

describe('controle de acesso no front (mapa do shared)', () => {
  it.each<[Role, string[]]>([
    ['ADMIN', ['Dashboard', 'Clientes', 'Produtos', 'Pedidos', 'Usuários']],
    ['MANAGER', ['Dashboard', 'Clientes', 'Produtos', 'Pedidos']],
    ['SELLER', ['Dashboard', 'Clientes', 'Produtos', 'Pedidos']],
  ])('%s vê o menu certo e o papel no header', async (role, expected) => {
    signIn(role);
    mockLists();
    renderApp('/');

    await waitFor(async () => expect(await menuLabels()).toEqual(expected));
    expect(screen.getByRole('link', { name: /Kaio Teste/ })).toHaveTextContent(
      { ADMIN: 'Administrador', MANAGER: 'Gerente', SELLER: 'Vendedor' }[role],
    );
  });

  it('SELLER não vê excluir, editar nem cadastrar produto', async () => {
    signIn('SELLER');
    mockLists();
    renderApp('/products');

    const table = await screen.findByRole('table', { name: 'Produtos' });
    expect(await within(table).findByText('Cabo USB-C')).toBeInTheDocument();
    // nome sem link de edição e sem coluna de ações
    expect(
      within(table).queryByRole('link', { name: 'Cabo USB-C' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Excluir/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Editar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Novo produto' }),
    ).not.toBeInTheDocument();
  });

  it('SELLER cadastra cliente, mas não edita nem exclui', async () => {
    signIn('SELLER');
    mockLists();
    renderApp('/customers');

    const table = await screen.findByRole('table', { name: 'Clientes' });
    expect(
      await within(table).findByRole('link', { name: 'Ana Souza' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Novo cliente' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Excluir/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Editar/ }),
    ).not.toBeInTheDocument();
  });

  it('MANAGER vê excluir produto', async () => {
    signIn('MANAGER');
    mockLists();
    renderApp('/products');

    // tabela (desktop) e card (mobile) renderizam as ações
    expect(
      await screen.findAllByRole('button', { name: 'Excluir Cabo USB-C' }),
    ).not.toHaveLength(0);
    expect(
      screen.getByRole('link', { name: 'Novo produto' }),
    ).toBeInTheDocument();
  });

  it('SELLER registra o pagamento, mas não cancela pedido', async () => {
    signIn('SELLER');
    mockLists();
    renderApp(`/orders/${order.id}`);

    expect(
      await screen.findByRole('button', { name: 'Registrar pagamento' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancelar pedido' }),
    ).not.toBeInTheDocument();
  });

  // tabela escrita à mão: status (máquina de estados) × papel (mapa)
  const ACTION_LABELS = [
    'Registrar pagamento',
    'Marcar como enviado',
    'Marcar como entregue',
    'Cancelar pedido',
  ];
  const MANAGER_ACTIONS: Record<OrderStatus, string[]> = {
    pending: ['Registrar pagamento', 'Cancelar pedido'],
    paid: ['Marcar como enviado', 'Cancelar pedido'],
    shipped: ['Marcar como entregue'],
    delivered: [],
    canceled: [],
  };
  const EXPECTED_ACTIONS: Record<Role, Record<OrderStatus, string[]>> = {
    ADMIN: MANAGER_ACTIONS,
    MANAGER: MANAGER_ACTIONS,
    SELLER: {
      pending: ['Registrar pagamento'],
      paid: [],
      shipped: [],
      delivered: [],
      canceled: [],
    },
  };
  const actionCases = (Object.keys(EXPECTED_ACTIONS) as Role[]).flatMap(role =>
    (Object.keys(MANAGER_ACTIONS) as OrderStatus[]).map(
      status => [role, status, EXPECTED_ACTIONS[role][status]] as const,
    ),
  );

  it.each(actionCases)(
    '%s com pedido %s vê as ações %j',
    async (role, status, expected) => {
      signIn(role);
      mockLists();
      server.use(
        http.get(`${API}/orders/:id`, () =>
          HttpResponse.json(orderWith(status)),
        ),
      );
      renderApp(`/orders/${order.id}`);

      await screen.findByRole('list', { name: 'Histórico do pedido' });
      const shown = screen
        .queryAllByRole('button')
        .map(button => button.textContent)
        .filter(label => ACTION_LABELS.includes(label ?? ''));
      expect(shown).toEqual(expected);
    },
  );

  it.each<[Role, string]>([
    ['SELLER', '/users'],
    ['SELLER', '/products/new'],
    ['SELLER', `/customers/${customer.id}/edit`],
    ['MANAGER', '/users/new'],
  ])(
    '%s abrindo %s pela URL vê a página 403 dentro do layout',
    async (role, path) => {
      signIn(role);
      mockLists();
      renderApp(path);

      expect(
        await screen.findByRole('heading', { name: 'Acesso não permitido' }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('navigation', { name: 'Principal' })[0],
      ).toBeInTheDocument();
    },
  );
});
