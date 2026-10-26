import { createConfig } from '@sellmanager/config/eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  environment: 'browser',
  extend: [
    {
      files: ['**/*.{ts,tsx}'],
      ...reactHooks.configs.flat['recommended-latest'],
    },
    reactRefresh.configs.vite,
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
  ],
});
