import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { errorResponse, page, product, signIn } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';
const soldOut = {
  ...product,
  id: '9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d02',
  name: 'Webcam',
  quantity: 0,
};
const low = {
  ...product,
  id: '9f8c1a52-4d4e-4a1b-9d0c-2f6a7b8c9d03',
  name: 'Hub USB',
  quantity: 3,
};

function mockProducts() {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/products`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const q = params.get('q')?.toLowerCase() ?? '';
      return HttpResponse.json(
        page(
          [product, soldOut, low].filter(item =>
            item.name.toLowerCase().includes(q),
          ),
        ),
      );
    }),
    http.get(`${API}/products/:id`, () => HttpResponse.json(product)),
  );
  return requests;
}

describe('Produtos', () => {
  it('lista com preço em BRL, destaque de estoque e busca na URL', async () => {
    signIn();
    const requests = mockProducts();
    const { router } = renderApp('/products');
    const typing = userEvent.setup();

    const table = await screen.findByRole('table', { name: 'Produtos' });
    expect(
      await within(table).findByRole('link', { name: 'Cabo USB-C' }),
    ).toBeInTheDocument();
    expect(within(table).getAllByText('R$ 49,90')).toHaveLength(3);
    expect(within(table).getByText('Esgotado')).toBeInTheDocument();
    expect(within(table).getByText('Baixo · 3 un.')).toBeInTheDocument();
    expect(within(table).getByText('10 un.')).toBeInTheDocument();

    await typing.type(
      screen.getByRole('searchbox', { name: 'Buscar produtos por nome' }),
      'hub',
    );
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ q: 'hub' }),
    );
    await waitFor(() => expect(requests.at(-1)?.get('q')).toBe('hub'));
    await waitFor(() =>
      expect(
        within(table).queryByRole('link', { name: 'Cabo USB-C' }),
      ).not.toBeInTheDocument(),
    );

    await typing.click(within(table).getByRole('button', { name: /Preço/ }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        q: 'hub',
        sort: 'price',
        order: 'asc',
      }),
    );
  });

  it('cria com o preço em centavos e segue para a tela de imagem', async () => {
    signIn();
    mockProducts();
    let body: unknown;
    server.use(
      http.post(`${API}/products`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(product, { status: 201 });
      }),
    );
    const { router } = renderApp('/products/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), 'Cabo USB-C');
    await typing.type(screen.getByLabelText('Preço'), '1.234,56');
    await typing.type(screen.getByLabelText('Estoque'), '10');
    await typing.click(
      screen.getByRole('button', { name: 'Cadastrar produto' }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/products/${product.id}/edit`,
      ),
    );
    expect(body).toEqual({
      name: 'Cabo USB-C',
      price_cents: 123456,
      quantity: 10,
    });
    expect(await screen.findByText('Sem imagem')).toBeInTheDocument();
  });

  it('nome duplicado (409 da API) aparece no campo e o botão volta a habilitar', async () => {
    signIn();
    server.use(
      http.post(`${API}/products`, () =>
        errorResponse(
          409,
          'ALREADY_EXISTS',
          'There is already one product with this name',
          {
            issues: [
              {
                segment: 'body',
                path: 'name',
                message: 'There is already one product with this name',
              },
            ],
          },
        ),
      ),
    );
    renderApp('/products/new');
    const typing = userEvent.setup();

    await typing.type(await screen.findByLabelText('Nome'), 'Cabo');
    await typing.type(screen.getByLabelText('Preço'), '10');
    await typing.type(screen.getByLabelText('Estoque'), '1');
    await typing.click(
      screen.getByRole('button', { name: 'Cadastrar produto' }),
    );

    expect(
      await screen.findByText('Já está em uso por outro cadastro.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInvalid();
    expect(
      screen.getByRole('button', { name: 'Cadastrar produto' }),
    ).toBeEnabled();
  });

  it('exclui após confirmar e explica a recusa quando está em pedidos', async () => {
    signIn();
    mockProducts();
    const deleted: string[] = [];
    server.use(
      http.delete(`${API}/products/:id`, ({ params }) => {
        if (params.id === product.id) {
          return errorResponse(409, 'RESOURCE_IN_USE', 'Product is in orders', {
            details: { orders_count: 1 },
          });
        }
        deleted.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/products');
    const typing = userEvent.setup();
    const table = await screen.findByRole('table', { name: 'Produtos' });

    await typing.click(
      await within(table).findByRole('button', { name: 'Excluir Webcam' }),
    );
    await typing.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Excluir',
      }),
    );
    await waitFor(() => expect(deleted).toEqual([soldOut.id]));

    await typing.click(
      within(table).getByRole('button', { name: 'Excluir Cabo USB-C' }),
    );
    await typing.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Excluir',
      }),
    );
    expect(
      await screen.findByText(/está em 1 pedido e não pode ser excluído/),
    ).toBeInTheDocument();
  });

  it('upload: rejeita arquivo inválido, mostra preview e envia substituindo a imagem', async () => {
    signIn();
    mockProducts();
    let received = '';
    // o XHR do jsdom faz preflight CORS (no app real o proxy do Vite deixa tudo na mesma origem)
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH',
      'Access-Control-Allow-Headers': 'Authorization',
    };
    server.use(
      http.options(
        `${API}/products/:id/image`,
        () => new HttpResponse(null, { status: 204, headers: cors }),
      ),
      http.patch(`${API}/products/:id/image`, async ({ request }) => {
        // o corpo multipart cru (o parser de FormData do Node não aceita o File do jsdom)
        received = await request.text();
        return HttpResponse.json(
          { ...product, image_url: 'http://api.test/files/nova.png' },
          { headers: cors },
        );
      }),
    );
    renderApp(`/products/${product.id}/edit`);
    const typing = userEvent.setup({ applyAccept: false });
    const input = await screen.findByLabelText('Arquivo da imagem');

    await typing.upload(
      input,
      new File(['gif'], 'anim.gif', { type: 'image/gif' }),
    );
    expect(screen.getByText(/Formato não suportado/)).toBeInTheDocument();

    await typing.upload(
      input,
      new File(['png'], 'foto.png', { type: 'image/png' }),
    );
    expect(
      screen.getByRole('img', { name: 'Pré-visualização da nova imagem' }),
    ).toBeInTheDocument();
    await typing.click(screen.getByRole('button', { name: 'Enviar imagem' }));

    expect(
      await screen.findByRole('img', { name: 'Imagem atual do produto' }),
    ).toHaveAttribute('src', 'http://api.test/files/nova.png');
    expect(received).toContain('name="image"; filename="foto.png"');
    expect(received).toContain('Content-Type: image/png');
    expect(await screen.findByText('Imagem atualizada.')).toBeInTheDocument();
  });
});
