import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { category, errorResponse, page, signIn } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';

describe('Relatórios', () => {
  const saved: { href: string; download: string }[] = [];

  beforeEach(() => {
    saved.length = 0;
    // o jsdom não baixa arquivos: registra o que seria salvo
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push({ href: this.href, download: this.download });
    });
    server.use(
      http.get(`${API}/categories`, () => HttpResponse.json(page([category]))),
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('exporta com o período e os filtros, e salva com o nome da API', async () => {
    signIn('MANAGER');
    const requests: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/reports/products`, ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return new HttpResponse('﻿Produto;Estoque\r\nCabo;3\r\n', {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition':
              'attachment; filename="produtos.csv"; filename*=UTF-8\'\'produtos_2026-10-01_a_2026-10-07.csv',
            'Access-Control-Expose-Headers': 'Content-Disposition',
          },
        });
      }),
    );
    renderApp('/reports?preset=7d');
    const typing = userEvent.setup();

    await typing.click(
      await screen.findByRole('checkbox', {
        name: 'Só abaixo do estoque mínimo',
      }),
    );
    await typing.click(
      screen.getByRole('button', { name: 'Exportar produtos (CSV)' }),
    );

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toEqual({
      href: 'blob:csv',
      download: 'produtos_2026-10-01_a_2026-10-07.csv',
    });
    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      preset: '7d',
      below_min_stock: 'true',
    });
    expect(
      await screen.findByText(
        'Arquivo produtos_2026-10-01_a_2026-10-07.csv gerado.',
      ),
    ).toBeInTheDocument();
  });

  it('erro da API aparece como aviso e nada é salvo', async () => {
    signIn('MANAGER');
    server.use(
      http.get(`${API}/reports/sales`, () =>
        errorResponse(500, 'INTERNAL_ERROR', 'boom'),
      ),
    );
    renderApp('/reports');
    const typing = userEvent.setup();

    await typing.click(
      await screen.findByRole('button', { name: 'Exportar vendas (CSV)' }),
    );

    expect(
      await screen.findByText('Algo deu errado no servidor. Tente novamente.'),
    ).toBeInTheDocument();
    expect(saved).toHaveLength(0);
  });
});
