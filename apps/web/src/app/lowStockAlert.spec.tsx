import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { page, product, signIn } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';
const low = {
  ...product,
  name: 'Hub USB',
  quantity: 1,
  min_stock: 5,
  below_min_stock: true,
};

describe('alerta de estoque baixo no layout', () => {
  it('mostra a contagem no cabeçalho e leva à lista de estoque baixo', async () => {
    signIn('SELLER');
    server.use(
      http.get(`${API}/products/low-stock`, () =>
        HttpResponse.json(page([low], 3)),
      ),
    );
    const { router } = renderApp('/');
    const typing = userEvent.setup();

    const alert = await screen.findByRole('link', {
      name: '3 produtos abaixo do estoque mínimo',
    });
    await typing.click(alert);

    expect(router.state.location.pathname).toBe('/products/low-stock');
    const table = await screen.findByRole('table', {
      name: 'Produtos abaixo do mínimo',
    });
    expect(table).toHaveTextContent('Hub USB');
    expect(table).toHaveTextContent('Baixo · 1 un.');
  });

  it('sem produtos abaixo do mínimo, não há alerta', async () => {
    signIn();
    renderApp('/');

    await screen.findByRole('navigation', { name: 'Principal' });
    expect(
      screen.queryByRole('link', { name: /abaixo do estoque mínimo/ }),
    ).not.toBeInTheDocument();
  });
});
