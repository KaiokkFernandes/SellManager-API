import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { App } from '@/app/App';
import { Providers } from '@/app/Providers';
import { createAppRouter } from '@/app/router';

/** Monta o app inteiro (providers + router em memória) na rota informada. */
export function renderApp(path = '/') {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createAppRouter({ history });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const result = render(
    <Providers queryClient={queryClient}>
      <App router={router} />
    </Providers>,
  );
  return { ...result, router, history, queryClient };
}
