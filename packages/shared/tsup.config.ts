import { defineConfig } from 'tsup';

// ESM para o Vite (web) e CJS para a API (Node/CommonJS), com .d.ts/.d.cts.
// zod é peerDependency e fica de fora do bundle: API e schemas usam a mesma
// instância do zod (necessário para o extendZodWithOpenApi da API).
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2023',
});
