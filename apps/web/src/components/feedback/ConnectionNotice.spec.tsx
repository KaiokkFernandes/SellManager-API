import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConnectionNotice } from './ConnectionNotice';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function setup() {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <ConnectionNotice delay={10} />
    </QueryClientProvider>,
  );

  return (key: string) => {
    let finish = () => {};
    void client.fetchQuery({
      queryKey: [key],
      queryFn: () =>
        new Promise<string>(resolve => {
          finish = () => resolve('ok');
        }),
    });
    return () => finish();
  };
}

describe('ConnectionNotice', () => {
  it('aparece se a primeira requisição demora e some quando ela termina', async () => {
    const start = setup();
    const finish = start('primeira');

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Conectando ao servidor...',
    );

    finish();
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('login em andamento (mutation) também conta', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <ConnectionNotice delay={10} />
      </QueryClientProvider>,
    );

    void client
      .getMutationCache()
      .build(client, { mutationFn: () => new Promise(() => undefined) })
      .execute(undefined);

    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('não volta nas requisições seguintes', async () => {
    const start = setup();
    const finish = start('primeira');
    await wait(1);
    finish();
    await wait(5);

    start('segunda');
    await wait(40);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
