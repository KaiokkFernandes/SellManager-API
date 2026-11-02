import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { defineConfig as defineVitestConfig, mergeConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  // API_PROXY_TARGET: para onde o proxy de dev encaminha /api (só dev, não vai ao bundle)
  const proxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:3333';

  return mergeConfig(
    {
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: { '@': path.resolve(import.meta.dirname, 'src') },
      },
      server: {
        // mesma porta dos padrões da API (APP_WEB_URL e CORS_ORIGIN)
        port: 3000,
        strictPort: true,
        proxy: {
          // mantém o Host, como no mesmo domínio em produção (sem CORS). A forma
          // curta `'/api': url` ligaria o changeOrigin
          '/api': { target: proxyTarget, changeOrigin: false },
        },
      },
      preview: { port: 3000 },
    },
    defineVitestConfig({
      test: {
        environment: 'jsdom',
        // e2e (Playwright) roda à parte: pnpm --filter web e2e
        include: ['src/**/*.spec.{ts,tsx}'],
        globals: false,
        setupFiles: ['./src/test/setup.ts'],
        css: false,
        // userEvent no jsdom fica lento quando o turbo roda tudo em paralelo
        testTimeout: 15_000,
        env: { VITE_API_URL: 'http://api.test' },
      },
    }),
  );
});
