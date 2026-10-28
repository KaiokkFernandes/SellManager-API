import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { tokenStorage } from '@/lib/tokenStorage';
import { errorResponse, inOneHour, makeToken, signIn } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

const API = 'http://api.test';

async function fillPassword(
  current: string,
  next: string,
  confirmation = next,
) {
  const typing = userEvent.setup();
  await typing.type(await screen.findByLabelText('Senha atual'), current);
  await typing.type(screen.getByLabelText('Nova senha'), next);
  await typing.type(
    screen.getByLabelText('Confirme a nova senha'),
    confirmation,
  );
  await typing.click(screen.getByRole('button', { name: 'Trocar senha' }));
}

describe('Meu perfil', () => {
  it('qualquer papel acessa pelo link do header e edita o nome', async () => {
    const profile = signIn('SELLER');
    let body: unknown;
    server.use(
      http.put(`${API}/profile`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...profile, name: 'Kaio F' });
      }),
      http.get(`${API}/products`, () =>
        HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 1, total: 0, total_pages: 0 },
        }),
      ),
      http.get(`${API}/customers`, () =>
        HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 1, total: 0, total_pages: 0 },
        }),
      ),
      http.get(`${API}/orders`, () =>
        HttpResponse.json({
          data: [],
          meta: { page: 1, limit: 1, total: 0, total_pages: 0 },
        }),
      ),
    );
    const { router } = renderApp('/');
    const typing = userEvent.setup();

    await typing.click(await screen.findByRole('link', { name: /Kaio Teste/ }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/profile'),
    );
    expect(screen.getByText('kaio@example.com · Vendedor')).toBeInTheDocument();

    const name = screen.getByLabelText('Nome');
    await typing.clear(name);
    await typing.type(name, 'Kaio F');
    await typing.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
    expect(body).toEqual({ name: 'Kaio F' });
  });

  it('valida a confirmação com o schema do shared (em pt-BR), sem chamar a API', async () => {
    signIn('SELLER');
    renderApp('/profile');

    await fillPassword('senha-atual', 'nova-senha-123', 'diferente-123');

    expect(
      await screen.findByText('As senhas não conferem'),
    ).toBeInTheDocument();
  });

  it('senha atual errada aparece no campo; sucesso troca o token da sessão', async () => {
    const profile = signIn('MANAGER');
    const freshToken = makeToken(inOneHour() + 60);
    let wrong = true;
    server.use(
      http.put(`${API}/profile/password`, () =>
        wrong
          ? errorResponse(400, 'VALIDATION_FAILED', 'Validation failed', {
              issues: [
                {
                  segment: 'body',
                  path: 'current_password',
                  message: 'Senha atual incorreta',
                },
              ],
            })
          : HttpResponse.json({ user: profile, token: freshToken }),
      ),
    );
    renderApp('/profile');

    await fillPassword('errada-123', 'nova-senha-123');
    expect(
      await screen.findByText('Senha atual incorreta'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Senha atual')).toBeInvalid();

    wrong = false;
    await userEvent.click(screen.getByRole('button', { name: 'Trocar senha' }));
    expect(
      await screen.findByText(
        'Senha alterada. As outras sessões foram encerradas.',
      ),
    ).toBeInTheDocument();
    expect(tokenStorage.get()).toBe(freshToken);
    expect(screen.getByLabelText('Senha atual')).toHaveValue('');
  });
});
