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

// APIs de navegador que o jsdom não tem (Radix Popover, cmdk, preview de imagem)
/* eslint-disable @typescript-eslint/unbound-method -- só checa se o método existe */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => undefined;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => undefined;
let objectUrls = 0;
URL.createObjectURL ??= () => `blob:preview-${(objectUrls += 1)}`;
URL.revokeObjectURL ??= () => undefined;
/* eslint-enable @typescript-eslint/unbound-method */

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  tokenStorage.clear();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
afterAll(() => server.close());
