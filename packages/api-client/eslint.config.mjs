import { createConfig } from '@sellmanager/config/eslint';

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  environment: 'browser',
  // gerado pelo openapi-typescript
  ignores: ['src/generated/**'],
});
