import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@sellmanager/api-client';
import { RouteError } from './RouteError';

describe('RouteError', () => {
  it('mostra mensagem amigável e "Tentar de novo" renderiza a rota outra vez', async () => {
    let failing = true;
    function Flaky() {
      if (failing) throw new ApiClientError(500, undefined);
      return <p>Carregou</p>;
    }
    const root = createRootRoute();
    const index = createRoute({
      getParentRoute: () => root,
      path: '/',
      component: Flaky,
    });
    const router = createRouter({
      routeTree: root.addChildren([index]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
      defaultErrorComponent: RouteError,
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Resposta inesperada/,
    );
    failing = false; // o problema foi resolvido antes de tentar de novo
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );

    expect(await screen.findByText('Carregou')).toBeInTheDocument();
  });
});
