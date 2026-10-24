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
  ],
});
