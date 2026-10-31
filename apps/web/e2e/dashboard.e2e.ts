import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { login } from './support';

/** Dashboard e relatórios contra a API real, com o seed de 12 meses. */
test('dashboard: KPIs, gráfico e blocos com dados do seed; período na URL', async ({
  page,
}) => {
  await login(page);

  const kpis = page.getByRole('list', { name: 'Indicadores' });
  await expect(kpis.getByText('Faturamento')).toBeVisible();
  await expect(kpis).toContainText('R$');
  // o gráfico (Recharts, carregado sob demanda) desenha a área
  await expect(page.locator('.recharts-area-area')).toBeVisible();
  await expect(
    page
      .getByRole('table', { name: 'Produtos com mais faturamento' })
      .getByRole('row'),
  ).toHaveCount(6);

  await page.getByRole('button', { name: 'Personalizado' }).click();
  await page.getByLabel('De').fill('2025-11-01');
  await page.getByLabel('Até').fill('2026-10-30');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL(/preset=custom&from=2025-11-01&to=2026-10-30/);
  // 12 meses: a série passa a ser mensal
  await expect(page.getByText('Vendas pagas, por mês')).toBeVisible();
  await page.screenshot({
    path: 'docs/screenshots/dashboard-12-meses.png',
    fullPage: true,
  });

  // status leva à lista de pedidos filtrada pelo mesmo período
  await page
    .getByRole('list', { name: 'Pedidos por status' })
    .getByRole('link', { name: /Cancelado/ })
    .click();
  await expect(page).toHaveURL(
    /\/orders\?status=canceled&from=2025-11-01&to=2026-10-30/,
  );
  await expect(page.getByRole('table', { name: 'Pedidos' })).toContainText(
    'Cancelado',
  );
});

test('relatórios: exporta o CSV de vendas pronto para o Excel em pt-BR', async ({
  page,
}) => {
  await login(page, 'MANAGER');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .first()
    .getByRole('link', { name: 'Relatórios' })
    .click();

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar vendas (CSV)' }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toMatch(
    /^vendas_\d{4}-\d{2}-\d{2}_a_\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const bytes = await readFile(await download.path());
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM
  const lines = bytes.toString('utf8').slice(1).split('\r\n');
  expect(lines[0]).toBe(
    'Pedido;Data do pagamento;Cliente;E-mail;Status;Itens;Total (R$);Criado por;ID do pedido',
  );
  expect(lines[1]).toMatch(/;\d{2}\/\d{2}\/\d{4} \d{2}:\d{2};.*;\d+,\d{2};/);
  await page.screenshot({
    path: 'docs/screenshots/relatorios-desktop-light.png',
  });
});

test('vendedor: dashboard com "Seus números" e sem Relatórios', async ({
  page,
}) => {
  await login(page, 'SELLER');
  await expect(page.getByText('Seus números')).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Principal' })
      .first()
      .getByRole('link', { name: 'Relatórios' }),
  ).toHaveCount(0);
  await page.goto('/reports');
  await expect(
    page.getByRole('heading', { name: 'Acesso não permitido' }),
  ).toBeVisible();
});
