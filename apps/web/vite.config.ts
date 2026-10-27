import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { defineConfig as defineVitestConfig, mergeConfig } from 'vitest/config';

/**
 * Política de segurança de conteúdo do app em produção (meta tag no index.html).
 * Scripts só do próprio domínio (sem inline/eval); estilos permitem inline porque
 * Radix e Sonner injetam <style> em runtime. Em dev ela não é aplicada, pois o HMR
 * do Vite precisa de scripts inline.
 */
function contentSecurityPolicy(apiUrl: string): Plugin {
  const apiOrigin = apiUrl.startsWith('/') ? '' : new URL(apiUrl).origin;
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    name: 'sellmanager:csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  // API_PROXY_TARGET: para onde o proxy de dev encaminha /api (só dev, não vai ao bundle)
  const proxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:3333';
  const apiUrl = env.VITE_API_URL ?? '/api';

  return mergeConfig(
    {
      plugins: [react(), tailwindcss(), contentSecurityPolicy(apiUrl)],
      resolve: {
        alias: { '@': path.resolve(import.meta.dirname, 'src') },
      },
      server: {
        // mesma porta dos padrões da API (APP_WEB_URL e CORS_ORIGIN)
        port: 3000,
        strictPort: true,
        proxy: {
          // /api/products -> http://localhost:3333/products (sem CORS no navegador)
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            rewrite: (p: string) => p.replace(/^\/api/, ''),
          },
        },
      },
      preview: { port: 3000 },
    },
    defineVitestConfig({
      test: {
        environment: 'jsdom',
        globals: false,
        setupFiles: ['./src/test/setup.ts'],
        css: false,
        env: { VITE_API_URL: 'http://api.test' },
      },
    }),
  );
});
