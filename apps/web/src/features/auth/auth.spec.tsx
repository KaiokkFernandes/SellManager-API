import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';
import {
  errorResponse,
  inOneHour,
  makeToken,
  page,
  session,
  user,
} from '@/test/fixtures';
import { tokenStorage } from '@/lib/tokenStorage';

const API = 'http://api.test';

function mockDashboardApi() {
  server.use(
    http.get(`${API}/profile`, () => HttpResponse.json(user)),
    http.get(`${API}/products`, () => HttpResponse.json(page([], 3))),
    http.get(`${API}/customers`, () => HttpResponse.json(page([], 2))),
    http.get(`${API}/orders`, () => HttpResponse.json(page([], 1))),
  );
}

async function fillAndSubmitLogin(
  email = 'kaio@example.com',
  password = 'senha123',
) {
  const typing = userEvent.setup();
  await typing.type(await screen.findByLabelText('E-mail'), email);
  await typing.type(screen.getByLabelText('Senha'), password);
  await typing.click(screen.getByRole('button', { name: 'Entrar' }));
  return typing;
}

describe('login', () => {
  it('entra com sucesso, guarda o token e abre o dashboard', async () => {
    const issued = session();
    server.use(http.post(`${API}/sessions`, () => HttpResponse.json(issued)));
    mockDashboardApi();
    renderApp('/login');

    await fillAndSubmitLogin();

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(tokenStorage.get()).toBe(issued.token);
    expect(
      await screen.findByText('Kaio Teste', { selector: 'span' }),
    ).toBeInTheDocument();
  });

  it('mostra erro no formulário com credencial inválida e não guarda token', async () => {
    server.use(
      http.post(`${API}/sessions`, () =>
        errorResponse(
          401,
          'UNAUTHORIZED',
          'Incorrect email/password combination.',
        ),
      ),
    );
    renderApp('/login');

    await fillAndSubmitLogin('kaio@example.com', 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha incorretos.',
    );
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(tokenStorage.get()).toBeNull();
  });

  it('valida com o schema do shared antes de chamar a API', async () => {
    // nenhum handler: qualquer requisição falharia o teste (onUnhandledFrame: error)
    renderApp('/login');

    await fillAndSubmitLogin('nao-e-email', 'x');

    expect(
      await screen.findByText(/email/i, { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it('exibe os erros de campo devolvidos pela API', async () => {
    server.use(
      http.post(`${API}/sessions`, () =>
        errorResponse(400, 'VALIDATION_FAILED', 'Validation failed', {
          issues: [
            {
              segment: 'body',
              path: 'email',
              message: 'E-mail recusado pela API',
            },
          ],
        }),
      ),
    );
    renderApp('/login');

    await fillAndSubmitLogin();

    expect(
      await screen.findByText('E-mail recusado pela API'),
    ).toBeInTheDocument();
  });
});

describe('rotas protegidas', () => {
  it('sem sessão, vai para o login e volta à rota de origem após entrar', async () => {
    server.use(
      http.post(`${API}/sessions`, () => HttpResponse.json(session())),
    );
    mockDashboardApi();
    const { router } = renderApp('/products');

    expect(
      await screen.findByRole('heading', { name: 'Entrar no SellManager' }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ redirect: '/products' });

    await fillAndSubmitLogin();

    expect(
      await screen.findByRole('heading', { name: 'Produtos' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/products');
  });

  it('ignora redirect para fora do app', async () => {
    server.use(
      http.post(`${API}/sessions`, () => HttpResponse.json(session())),
    );
    mockDashboardApi();
    const { router } = renderApp('/login?redirect=https://evil.example.com');

    await fillAndSubmitLogin();

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('usuário logado que abre /login vai para o dashboard', async () => {
    tokenStorage.set(makeToken(inOneHour()));
    mockDashboardApi();
    const { router } = renderApp('/login');

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('mantém a sessão ao recarregar (token persistido) e busca o usuário no perfil', async () => {
    tokenStorage.set(makeToken(inOneHour()));
    mockDashboardApi();
    renderApp('/customers');

    expect(
      await screen.findByRole('heading', { name: 'Clientes' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Kaio Teste', { selector: 'span' }),
    ).toBeInTheDocument();
  });

  it('descarta token já expirado ao iniciar', async () => {
    tokenStorage.set(makeToken(Math.floor(Date.now() / 1000) - 10));
    renderApp('/products');

    expect(
      await screen.findByRole('heading', { name: 'Entrar no SellManager' }),
    ).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('fim de sessão', () => {
  it('401 da API faz logout e leva ao login preservando a rota de origem', async () => {
    tokenStorage.set(makeToken(inOneHour()));
    server.use(
      http.get(`${API}/profile`, () => HttpResponse.json(user)),
      http.get(`${API}/products`, () =>
        errorResponse(401, 'UNAUTHORIZED', 'Invalid JWT token'),
      ),
      http.get(`${API}/customers`, () => HttpResponse.json(page([]))),
      http.get(`${API}/orders`, () => HttpResponse.json(page([]))),
    );
    const { router } = renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'Entrar no SellManager' }),
    ).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
    expect(router.state.location.search).toEqual({ redirect: '/' });
    expect(
      await screen.findByText('Sua sessão não é mais válida. Entre novamente.'),
    ).toBeInTheDocument();
  });

  it('logout automático quando o token expira', async () => {
    tokenStorage.set(makeToken(Math.floor(Date.now() / 1000) + 1));
    mockDashboardApi();
    renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();

    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { name: 'Entrar no SellManager' }),
        ).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(tokenStorage.get()).toBeNull();
    expect(
      await screen.findByText('Sua sessão expirou. Entre novamente.'),
    ).toBeInTheDocument();
  });

  it('botão Sair limpa a sessão e vai ao login sem parâmetro de retorno', async () => {
    tokenStorage.set(makeToken(inOneHour()));
    mockDashboardApi();
    const { router } = renderApp('/orders');
    const typing = userEvent.setup();

    await typing.click(await screen.findByRole('button', { name: /Sair/ }));

    expect(
      await screen.findByRole('heading', { name: 'Entrar no SellManager' }),
    ).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
    expect(router.state.location.search).toEqual({});
  });
});
