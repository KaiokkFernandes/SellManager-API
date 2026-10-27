import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import '@/lib/zodLocale';
import { tokenStorage } from '@/lib/tokenStorage';
import { server } from './server';

// findBy/waitFor esperam até 5s: o turbo roda api e web em paralelo e o jsdom fica lento
configure({ asyncUtilTimeout: 5000 });

// jsdom não implementa matchMedia (usado pelo tema)
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  tokenStorage.clear();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
afterAll(() => server.close());
