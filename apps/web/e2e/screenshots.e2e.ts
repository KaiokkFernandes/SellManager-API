import { expect, test } from '@playwright/test';
import { login } from './support';

/** Prints das telas para o README: 375px e desktop, tema claro e escuro (preferência do sistema). */
const viewports = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1280, height: 860 },
} as const;
const pages = [
  { name: 'clientes', path: '/customers', ready: 'Clientes' },
  { name: 'produtos', path: '/products', ready: 'Produtos' },
  // inclui os produtos com imagem criados pelo fluxo e2e
  { name: 'produtos-busca', path: '/products?q=teclado', ready: 'Produtos' },
  { name: 'pedidos', path: '/orders', ready: 'Pedidos' },
  { name: 'novo-pedido', path: '/orders/new', ready: 'Novo pedido' },
] as const;

for (const scheme of ['light', 'dark'] as const) {
  for (const [device, viewport] of Object.entries(viewports)) {
    test(`telas em ${device} (${scheme})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport,
        colorScheme: scheme,
        locale: 'pt-BR',
      });
      const page = await context.newPage();
      await login(page);

      for (const target of pages) {
        await page.goto(target.path);
        await expect(
          page.getByRole('heading', { name: target.ready, level: 1 }),
        ).toBeVisible();
        await page.waitForLoadState('networkidle');
        // sem rolagem horizontal da página (a tabela rola só dentro do container)
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(
          overflow,
          `${target.path} em ${device} rola na horizontal`,
        ).toBeLessThanOrEqual(0);
        await page.screenshot({
          path: `docs/screenshots/${target.name}-${device}-${scheme}.png`,
        });
      }
      await context.close();
    });
  }
}
