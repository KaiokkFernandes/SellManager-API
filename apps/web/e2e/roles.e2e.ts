import { expect, test } from '@playwright/test';
import { login } from './support';

/** Papéis contra a API real: menu, botões e 403 pela URL (usuários do seed). */
test('vendedor: sem Usuários no menu, sem excluir e 403 pela URL', async ({
  page,
}) => {
  await login(page, 'SELLER');
  const nav = page.getByRole('navigation', { name: 'Principal' }).first();
  await expect(nav.getByRole('link', { name: 'Pedidos' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Usuários' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Vendedor/ })).toBeVisible();

  await page.goto('/products');
  await expect(page.getByRole('table', { name: 'Produtos' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Excluir/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Novo produto' })).toHaveCount(0);

  await page.goto('/users');
  await expect(
    page.getByRole('heading', { name: 'Acesso não permitido' }),
  ).toBeVisible();

  // pedido pendente do seed: o vendedor só registra o pagamento
  await page.goto('/orders?status=pending');
  await page
    .getByRole('table', { name: 'Pedidos' })
    .getByRole('link')
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: 'Registrar pagamento' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cancelar pedido' }),
  ).toHaveCount(0);
});

test('gerente: exclui produtos mas não gerencia usuários', async ({ page }) => {
  await login(page, 'MANAGER');
  await page.goto('/products');
  await expect(
    page.getByRole('button', { name: /^Excluir/ }).first(),
  ).toBeVisible();
  await page.goto('/users/new');
  await expect(
    page.getByRole('heading', { name: 'Acesso não permitido' }),
  ).toBeVisible();
});

test('admin: vê e filtra os usuários do seed', async ({ page }) => {
  await login(page, 'ADMIN');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .first()
    .getByRole('link', { name: 'Usuários' })
    .click();
  const table = page.getByRole('table', { name: 'Usuários' });
  await expect(table.getByText('gerente@sellmanager.dev')).toBeVisible();
  await expect(table.getByText('vendedor@sellmanager.dev')).toBeVisible();
  await page.screenshot({
    path: 'docs/screenshots/usuarios-desktop-light.png',
  });
});
