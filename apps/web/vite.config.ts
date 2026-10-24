import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // mesma porta dos padrões da API (APP_WEB_URL e CORS_ORIGIN)
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
  },
});
