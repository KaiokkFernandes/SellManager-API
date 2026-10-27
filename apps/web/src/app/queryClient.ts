import { ApiClientError } from '@sellmanager/api-client';
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // não insiste em erros do cliente (4xx): só em falha de rede/5xx, 1 vez
        retry: (failureCount, error) =>
          failureCount < 1 &&
          !(
            error instanceof ApiClientError &&
            error.status >= 400 &&
            error.status < 500
          ),
      },
    },
  });
}
