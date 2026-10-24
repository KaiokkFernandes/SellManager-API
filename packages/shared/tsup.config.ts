import { defineConfig } from 'tsup';

// ESM para o Vite (web) e CJS para a API (Node/CommonJS), com .d.ts/.d.cts.
// zod é peerDependency e fica de fora do bundle: API e schemas usam a mesma
// instância do zod.
export default defineConfig(options => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  // no watch (pnpm dev) não apaga o dist a cada rebuild: api e web estão lendo
  clean: !options.watch,
  target: 'es2023',
}));
