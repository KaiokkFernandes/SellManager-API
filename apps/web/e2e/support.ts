import { expect, type Page } from '@playwright/test';

/** Credenciais criadas pelo seed da API. */
export const ADMIN = { email: 'admin@sellmanager.dev', password: 'admin12345' };

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Senha').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

/** PNG de verdade (gradiente 256×256) gerado no navegador, para o upload. */
export async function makePng(page: Page, hue: number): Promise<Buffer> {
  const dataUrl = await page.evaluate(h => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas indisponível');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, `hsl(${h} 80% 60%)`);
    gradient.addColorStop(1, `hsl(${h + 60} 80% 35%)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return canvas.toDataURL('image/png');
  }, hue);
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64');
}

/** Escolhe uma opção em um dos nossos Combobox (busca no servidor). */
export async function pickOption(
  page: Page,
  combobox: string,
  search: string,
  option: string | RegExp,
) {
  await page.getByRole('combobox', { name: combobox }).click();
  await page
    .getByPlaceholder(/Buscar/)
    .last()
    .fill(search);
  await page.getByRole('option', { name: option }).first().click();
}
