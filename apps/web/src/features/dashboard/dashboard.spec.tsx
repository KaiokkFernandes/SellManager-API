import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { errorResponse, signIn } from '@/test/fixtures';
import { categories, revenue, summary } from '@/test/metricsFixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';

/** Guarda a query de cada chamada de métricas (por bloco). */
function spyMetrics() {
  const calls: { block: string; params: URLSearchParams }[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/metrics/'))
      calls.push({ block: url.pathname.slice(9), params: url.searchParams });
  });
  return calls;
}

describe('Dashboard', () => {
  it('KPIs com valor e variação contra o período anterior', async () => {
    signIn();
    renderApp('/');

    const kpis = await screen.findByRole('list', { name: 'Indicadores' });
    const card = (label: string) =>
      within(kpis).getByText(label).closest('li') as HTMLElement;
    expect(card('Faturamento')).toHaveTextContent('R$ 12.345,50');
    expect(card('Faturamento')).toHaveTextContent(
      '+23,5% vs 31/08/2026 a 29/09/2026',
    );
    expect(card('Vendas')).toHaveTextContent('50');
    expect(card('Ticket médio')).toHaveTextContent('R$ 246,91');
    expect(card('Ticket médio')).toHaveTextContent('-1,2%');
    // cancelados: taxa, quantidade e valor; variação em pontos
    expect(card('Cancelados')).toHaveTextContent('9,1%');
    expect(card('Cancelados')).toHaveTextContent('5 · R$ 980,00');
    expect(card('Cancelados')).toHaveTextContent('+4,3 p.p.');
    expect(
      screen.getByText(/Vendas de 30\/09\/2026 a 29\/10\/2026/),
    ).toBeInTheDocument();
  });

  it('sem base no período anterior mostra "—" em vez de variação', async () => {
    signIn();
    server.use(
      http.get(`${API}/metrics/summary`, () =>
        HttpResponse.json({
          ...summary,
          change: { ...summary.change, revenue: null },
        }),
      ),
    );
    renderApp('/');

    const kpis = await screen.findByRole('list', { name: 'Indicadores' });
    expect(
      within(kpis).getByText('Faturamento').closest('li'),
    ).toHaveTextContent('— sem base no período anterior');
  });

  it('trocar o período vai para a URL e refaz as queries com ele', async () => {
    signIn();
    const calls = spyMetrics();
    const { router } = renderApp('/');
    const typing = userEvent.setup();

    await screen.findByRole('list', { name: 'Indicadores' });
    expect(
      calls.find(call => call.block === 'summary')?.params.get('preset'),
    ).toBe('30d');

    await typing.click(screen.getByRole('button', { name: '7 dias' }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ preset: '7d' }),
    );
    await waitFor(() =>
      expect(
        calls
          .filter(call => call.params.get('preset') === '7d')
          .map(call => call.block),
      ).toContain('summary'),
    );
    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await typing.click(screen.getByRole('button', { name: 'Personalizado' }));
    fireEvent.change(screen.getByLabelText('De'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('Até'), {
      target: { value: '2026-10-31' },
    });
    await typing.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        preset: 'custom',
        from: '2026-10-01',
        to: '2026-10-31',
      }),
    );
    await waitFor(() => {
      const last = calls.filter(call => call.block === 'summary').at(-1);
      expect(last?.params.get('from')).toBe('2026-10-01');
      expect(last?.params.get('to')).toBe('2026-10-31');
    });
  });

  it('período personalizado invertido não aplica', async () => {
    signIn();
    renderApp('/?preset=custom');
    const typing = userEvent.setup();

    fireEvent.change(await screen.findByLabelText('De'), {
      target: { value: '2026-10-10' },
    });
    fireEvent.change(screen.getByLabelText('Até'), {
      target: { value: '2026-10-01' },
    });
    expect(
      screen.getByText('A data final deve ser igual ou posterior à inicial.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
    await typing.click(screen.getByRole('button', { name: '30 dias' }));
  });

  it('SELLER vê "Seus números"', async () => {
    signIn('SELLER');
    server.use(
      http.get(`${API}/metrics/summary`, () =>
        HttpResponse.json({ ...summary, scope: 'own' }),
      ),
    );
    renderApp('/');

    expect(await screen.findByText('Seus números')).toBeInTheDocument();
  });

  it('erro nos KPIs mostra "Tentar de novo" sem derrubar a página', async () => {
    signIn();
    let fail = true;
    server.use(
      http.get(`${API}/metrics/summary`, () =>
        fail
          ? errorResponse(500, 'INTERNAL_ERROR', 'boom')
          : HttpResponse.json(summary),
      ),
    );
    renderApp('/');
    const typing = userEvent.setup();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Algo deu errado no servidor');
    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument();
    fail = false;
    await typing.click(
      within(alert).getByRole('button', { name: 'Tentar de novo' }),
    );
    expect(
      await screen.findByRole('list', { name: 'Indicadores' }),
    ).toBeInTheDocument();
  });

  it('gráfico de faturamento traz os números numa tabela acessível', async () => {
    signIn();
    renderApp('/');

    const table = await screen.findByRole('table', {
      name: 'Faturamento por dia',
    });
    expect(
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map(row => row.textContent?.replace(/\s/g, ' ')),
    ).toEqual(['27/10R$ 500,002', '28/10R$ 0,000', '29/10R$ 749,003']);
  });

  it('categoria e status levam para a lista filtrada', async () => {
    signIn();
    renderApp('/');

    const byCategory = await screen.findByRole('list', {
      name: 'Vendas por categoria',
    });
    expect(
      within(byCategory).getByRole('link', { name: /Cabos/ }),
    ).toHaveAttribute(
      'href',
      '/products?category_id=2f1d3c4b-5a69-4788-9a0b-1c2d3e4f5a6b',
    );
    // "sem categoria" não tem filtro na lista de produtos: não é link
    expect(
      within(byCategory).getByText('Sem categoria').closest('a'),
    ).toBeNull();

    const byStatus = screen.getByRole('list', { name: 'Pedidos por status' });
    expect(
      within(byStatus).getByRole('link', { name: /Cancelado/ }),
    ).toHaveAttribute(
      'href',
      '/orders?status=canceled&from=2026-09-30&to=2026-10-29',
    );
  });

  it('um bloco com erro não derruba os outros', async () => {
    signIn();
    server.use(
      http.get(`${API}/metrics/categories`, () =>
        errorResponse(500, 'INTERNAL_ERROR', 'boom'),
      ),
    );
    renderApp('/');

    expect(
      await screen.findByRole('list', { name: 'Pedidos por status' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'Indicadores' }),
    ).toBeInTheDocument();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Algo deu errado no servidor');
    expect(
      within(alert).getByRole('button', { name: 'Tentar de novo' }),
    ).toBeInTheDocument();
  });

  it('período sem vendas mostra o vazio de cada bloco', async () => {
    signIn();
    server.use(
      http.get(`${API}/metrics/revenue`, () =>
        HttpResponse.json({
          ...revenue,
          points: revenue.points.map(p => ({
            ...p,
            revenue_cents: 0,
            orders: 0,
          })),
        }),
      ),
      http.get(`${API}/metrics/categories`, () =>
        HttpResponse.json({ ...categories, items: [] }),
      ),
    );
    renderApp('/');

    expect(await screen.findAllByText('Sem vendas no período.')).toHaveLength(
      2,
    );
  });

  it('top produtos e clientes levam ao item; SELLER vai para a lista filtrada', async () => {
    signIn();
    renderApp('/');

    const products = await screen.findByRole('table', {
      name: 'Produtos com mais faturamento',
    });
    expect(
      within(products).getByRole('link', { name: 'Cabo USB-C' }),
    ).toHaveAttribute(
      'href',
      '/products/9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d01/edit',
    );
    const customers = screen.getByRole('table', {
      name: 'Clientes com mais faturamento',
    });
    expect(
      within(customers).getByRole('link', { name: 'Ana Souza' }),
    ).toHaveAttribute(
      'href',
      '/customers/6e2ba4c6-96f5-4d7f-9303-6f6b91a1a960',
    );
  });

  it('SELLER (sem editar produto) vai para a lista filtrada pelo nome', async () => {
    signIn('SELLER');
    renderApp('/');

    const products = await screen.findByRole('table', {
      name: 'Produtos com mais faturamento',
    });
    expect(
      within(products).getByRole('link', { name: 'Cabo USB-C' }),
    ).toHaveAttribute('href', '/products?q=Cabo+USB-C');
  });

  it('aviso de estoque baixo com link para a lista', async () => {
    signIn();
    server.use(
      http.get(`${API}/products/low-stock`, () =>
        HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 1, total: 4, total_pages: 4 },
        }),
      ),
    );
    renderApp('/');

    expect(
      await screen.findByRole('link', {
        name: /4 produtos estão abaixo do estoque mínimo/,
      }),
    ).toHaveAttribute('href', '/products/low-stock');
  });
});
