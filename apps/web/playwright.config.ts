import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra a API REAL (banco de dev populado com `pnpm --filter api seed`).
 * Sobe api e web se ainda não estiverem rodando. Uso: pnpm --filter web e2e
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: 'http://localhost:3333/docs.json',
      reuseExistingServer: true,
      cwd: '../..',
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      cwd: '../..',
      timeout: 60_000,
    },
  ],
});
