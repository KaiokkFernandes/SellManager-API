import { createConfig } from '@sellmanager/config/eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Regra de dependência (espelha a Clean Architecture do back-end):
 *   app -> features -> components -> lib
 * Camadas internas nunca importam das externas; features não se importam entre
 * si (exceto `auth`, transversal); `test/` e `*.spec.*` ficam livres.
 */
const FEATURES = [
  'dashboard',
  'customers',
  'products',
  'orders',
  'users',
  'profile',
];

function restrict(files, groups, message) {
  return {
    files,
    ignores: ['**/*.spec.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: groups, message }] },
      ],
    },
  };
}

const layers = [
  restrict(
    ['src/lib/**/*.{ts,tsx}'],
    ['@/components/*', '@/features/*', '@/app/*'],
    'lib é a camada mais interna: não pode depender de components, features ou app.',
  ),
  restrict(
    ['src/components/**/*.{ts,tsx}'],
    ['@/features/*', '@/app/*'],
    'components não pode depender de features ou app (receba dados por props).',
  ),
  restrict(
    ['src/features/auth/**/*.{ts,tsx}'],
    ['@/app/*', ...FEATURES.map(feature => `@/features/${feature}`)],
    'auth não pode depender do app nem de outras features.',
  ),
  ...FEATURES.map(feature =>
    restrict(
      [`src/features/${feature}/**/*.{ts,tsx}`],
      [
        '@/app/*',
        ...FEATURES.filter(other => other !== feature).map(
          other => `@/features/${other}`,
        ),
        ...FEATURES.filter(other => other !== feature).map(
          other => `@/features/${other}/*`,
        ),
      ],
      'uma feature não importa de outra (só de auth, components e lib). Suba o código compartilhado para components ou lib.',
    ),
  ),
];

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  environment: 'browser',
  extend: [
    {
      files: ['**/*.{ts,tsx}'],
      ...reactHooks.configs.flat['recommended-latest'],
    },
    reactRefresh.configs.vite,
    // acessibilidade: labels, alt, roles válidos, foco, etc.
    { files: ['**/*.{ts,tsx}'], ...jsxA11y.flatConfigs.recommended },
    {
      // TanStack Router redireciona com `throw redirect(...)`
      files: ['**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/only-throw-error': [
          'error',
          {
            allow: [
              {
                from: 'package',
                package: '@tanstack/router-core',
                name: 'Redirect',
              },
            ],
          },
        ],
      },
    },
    ...layers,
  ],
});
