import type { User } from '@sellmanager/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { errorResponse, page, signIn, user as me } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';
const seller: User = {
  ...me,
  id: '7d1c2b3a-0000-4000-8000-000000000002',
  name: 'Bia Vendas',
  email: 'bia@example.com',
  role: 'SELLER',
};

function mockUsers() {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/users`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const role = params.get('role');
      return HttpResponse.json(
        page([me, seller].filter(item => !role || item.role === role)),
      );
    }),
    http.get(`${API}/users/:id`, ({ params }) =>
      HttpResponse.json(params.id === seller.id ? seller : me),
    ),
  );
  return requests;
}

describe('Usuários (ADMIN)', () => {
  it('lista com papel e situação; o filtro de papel vai para a URL e refaz a busca', async () => {
    signIn('ADMIN');
    const requests = mockUsers();
    const { router } = renderApp('/users');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Usuários' });
    expect(await within(table).findByText('Bia Vendas')).toBeInTheDocument();
    expect(within(table).getByText('Vendedor')).toBeInTheDocument();
    expect(within(table).getByText('(você)')).toBeInTheDocument();
    // não há como desativar a si mesmo
    expect(
      screen.queryByRole('button', { name: 'Desativar Kaio Teste' }),
    ).not.toBeInTheDocument();

    await typing.click(screen.getByRole('combobox', { name: 'Papel' }));
    await typing.click(await screen.findByRole('option', { name: 'Vendedor' }));

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ role: 'SELLER' }),
    );
    await waitFor(() => expect(requests.at(-1)?.get('role')).toBe('SELLER'));
  });

  it('cadastra com papel e senha inicial', async () => {
    signIn('ADMIN');
    mockUsers();
    let body: unknown;
    server.use(
      http.post(`${API}/users`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(seller, { status: 201 });
      }),
    );
    const { router } = renderApp('/users/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), 'Bia Vendas');
    await typing.type(screen.getByLabelText('E-mail'), 'BIA@example.com');
    await typing.click(screen.getByRole('combobox', { name: 'Papel' }));
    await typing.click(await screen.findByRole('option', { name: 'Gerente' }));
    await typing.type(
      screen.getByLabelText('Senha inicial'),
      'senha-inicial-1',
    );
    await typing.click(
      screen.getByRole('button', { name: 'Cadastrar usuário' }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    expect(body).toEqual({
      name: 'Bia Vendas',
      email: 'bia@example.com',
      role: 'MANAGER',
      password: 'senha-inicial-1',
    });
  });

  it('na própria conta o papel fica bloqueado e não há desativar', async () => {
    signIn('ADMIN');
    mockUsers();
    renderApp(`/users/${me.id}/edit`);

    expect(
      await screen.findByRole('combobox', { name: 'Papel' }),
    ).toBeDisabled();
    expect(
      screen.getByText('Você não pode alterar o próprio papel.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Você não pode desativar a si mesmo.'),
    ).toBeInTheDocument();
  });

  it('desativa outro usuário após confirmar e mostra a recusa do último ADMIN', async () => {
    signIn('ADMIN');
    mockUsers();
    let refuse = false;
    server.use(
      http.patch(`${API}/users/:id/status`, async ({ request }) => {
        if (refuse) {
          return errorResponse(
            409,
            'CONFLICT',
            'The last active admin cannot be demoted',
            {
              details: { reason: 'LAST_ADMIN' },
            },
          );
        }
        const { active } = (await request.json()) as { active: boolean };
        return HttpResponse.json({ ...seller, active });
      }),
    );
    renderApp('/users');
    const typing = userEvent.setup();
    const table = await screen.findByRole('table', { name: 'Usuários' });

    await typing.click(
      await within(table).findByRole('button', {
        name: 'Desativar Bia Vendas',
      }),
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Desativar Bia Vendas?',
    });
    await typing.click(
      within(dialog).getByRole('button', { name: 'Desativar' }),
    );
    expect(
      await screen.findByText(
        'Usuário desativado. As sessões dele foram encerradas.',
      ),
    ).toBeInTheDocument();

    refuse = true;
    await typing.click(
      within(table).getByRole('button', { name: 'Desativar Bia Vendas' }),
    );
    await typing.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Desativar',
      }),
    );
    expect(
      await screen.findByText(/último administrador ativo/),
    ).toBeInTheDocument();
  });
});
