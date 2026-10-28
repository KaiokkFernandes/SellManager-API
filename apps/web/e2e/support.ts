import { expect, type Page } from '@playwright/test';

/** Credenciais criadas pelo seed da API (só dev). */
export const SEED_USERS = {
  ADMIN: { email: 'admin@sellmanager.dev', password: 'admin12345' },
  MANAGER: { email: 'gerente@sellmanager.dev', password: 'gerente12345' },
  SELLER: { email: 'vendedor@sellmanager.dev', password: 'vendedor12345' },
} as const;

export async function login(
  page: Page,
  role: keyof typeof SEED_USERS = 'ADMIN',
) {
  const { email, password } = SEED_USERS[role];
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
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
