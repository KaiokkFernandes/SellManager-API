import type { Category } from '@sellmanager/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { category, errorResponse, page, signIn } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';

function mockCategories() {
  const categories: Category[] = [category];
  const posted: unknown[] = [];
  server.use(
    http.get(`${API}/categories`, () => HttpResponse.json(page(categories))),
    http.post(`${API}/categories`, async ({ request }) => {
      const body = (await request.json()) as { name: string };
      posted.push(body);
      if (body.name.toLowerCase() === 'cabos') {
        return errorResponse(409, 'ALREADY_EXISTS', 'exists', {
          issues: [{ segment: 'body', path: 'name', message: 'exists' }],
        });
      }
      const created = {
        ...category,
        id: '2f1d3c4b-5a69-4788-9a0b-1c2d3e4f5a6c',
        name: body.name,
        products_count: 0,
      };
      categories.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.delete(`${API}/categories/:id`, () =>
      errorResponse(409, 'RESOURCE_IN_USE', 'in use', {
        details: { products_count: 1 },
      }),
    ),
  );
  return posted;
}

describe('Categorias', () => {
  it('cria com o schema do shared e mostra o nome duplicado no campo', async () => {
    signIn('MANAGER');
    const posted = mockCategories();
    renderApp('/categories');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Categorias' });
    expect(await within(table).findByText('Cabos')).toBeInTheDocument();

    await typing.click(screen.getByRole('button', { name: 'Nova categoria' }));
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Nova categoria',
    });
    const name = within(dialog).getByLabelText('Nome');
    await typing.type(name, 'CABOS');
    await typing.click(
      within(dialog).getByRole('button', { name: 'Criar categoria' }),
    );
    expect(
      await within(dialog).findByText('Já está em uso por outro cadastro.'),
    ).toBeInTheDocument();

    await typing.clear(name);
    await typing.type(name, 'Mouses');
    await typing.click(
      within(dialog).getByRole('button', { name: 'Criar categoria' }),
    );
    expect(await screen.findByText('Categoria criada.')).toBeInTheDocument();
    expect(await within(table).findByText('Mouses')).toBeInTheDocument();
    expect(posted).toEqual([{ name: 'CABOS' }, { name: 'Mouses' }]);
  });

  it('explica por que não exclui categoria com produtos', async () => {
    signIn('MANAGER');
    mockCategories();
    renderApp('/categories');
    const typing = userEvent.setup();

    const [remove] = await screen.findAllByRole('button', {
      name: 'Excluir Cabos',
    });
    await typing.click(remove);
    const dialog = await screen.findByRole('alertdialog');
    await typing.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    expect(
      await within(dialog).findByText(/Há 1 produto\(s\) nesta categoria/),
    ).toBeInTheDocument();
  });

  it('SELLER vê a lista, mas sem criar, renomear ou excluir', async () => {
    signIn('SELLER');
    mockCategories();
    renderApp('/categories');

    const table = await screen.findByRole('table', { name: 'Categorias' });
    expect(await within(table).findByText('Cabos')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Nova categoria' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /Excluir|Renomear/ }),
      ).not.toBeInTheDocument(),
    );
  });
});
