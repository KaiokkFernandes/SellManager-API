import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { inOneHour, makeToken, page, user } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';
import { tokenStorage } from '@/lib/tokenStorage';

const API = 'http://api.test';

function loggedIn(path = '/') {
  tokenStorage.set(makeToken(inOneHour()));
  server.use(
    http.get(`${API}/profile`, () => HttpResponse.json(user)),
    http.get(`${API}/products`, () => HttpResponse.json(page([], 7))),
    http.get(`${API}/customers`, () => HttpResponse.json(page([], 4))),
    http.get(`${API}/orders`, () => HttpResponse.json(page([], 2))),
  );
  return renderApp(path);
}

describe('layout autenticado', () => {
  it('mostra navegação, usuário e logout', async () => {
    loggedIn();

    const [nav] = await screen.findAllByRole('navigation', {
      name: 'Principal',
    });
    for (const label of ['Dashboard', 'Clientes', 'Produtos', 'Pedidos']) {
      expect(
        within(nav).getByRole('link', { name: label }),
      ).toBeInTheDocument();
    }
    expect(
      await screen.findByText('Kaio Teste', { selector: 'span' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sair/ })).toBeInTheDocument();
  });

  it('dashboard abre com os indicadores do período', async () => {
    loggedIn();

    const kpis = await screen.findByRole('list', { name: 'Indicadores' });
    expect(kpis).toHaveTextContent('Faturamento');
    expect(kpis).toHaveTextContent('R$ 12.345,50');
  });

  it('navega entre as páginas e marca a rota ativa', async () => {
    loggedIn();
    const typing = userEvent.setup();
    const [nav] = await screen.findAllByRole('navigation', {
      name: 'Principal',
    });

    await typing.click(within(nav).getByRole('link', { name: 'Produtos' }));

    expect(
      await screen.findByRole('heading', { name: 'Produtos' }),
    ).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Produtos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      within(nav).getByRole('link', { name: 'Dashboard' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('recolhe a sidebar e abre o menu em drawer', async () => {
    loggedIn();
    const typing = userEvent.setup();

    const collapse = await screen.findByRole('button', {
      name: 'Recolher menu lateral',
    });
    await typing.click(collapse);
    expect(
      screen.getByRole('button', { name: 'Expandir menu lateral' }),
    ).toHaveAttribute('aria-expanded', 'false');

    await typing.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const drawer = await screen.findByRole('dialog');
    expect(
      within(drawer).getByRole('link', { name: 'Clientes' }),
    ).toBeInTheDocument();

    await typing.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra 404 dentro do app para rota desconhecida', async () => {
    loggedIn('/nao-existe');

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
  });

  it('alterna o tema e persiste a preferência', async () => {
    loggedIn();
    const typing = userEvent.setup();

    await typing.click(
      await screen.findByRole('button', { name: /Tema: sistema/ }),
    );
    expect(
      screen.getByRole('button', { name: /Tema: claro/ }),
    ).toBeInTheDocument();
    await typing.click(screen.getByRole('button', { name: /Tema: claro/ }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('sellmanager:theme')).toBe('dark');
  });
});
