import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { errorResponse, signIn } from '@/test/fixtures';
import { summary } from '@/test/metricsFixtures';
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
});
