import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Config base do ESLint (flat config, typescript-eslint com checagem de tipos).
 *
 * @param {object} options
 * @param {string} options.tsconfigRootDir pasta do pacote (import.meta.dirname)
 * @param {'node' | 'browser'} [options.environment]
 * @param {string[]} [options.testFiles] arquivos de teste, com regras de any relaxadas
 * @param {string[]} [options.ignores]
 * @param {import('typescript-eslint').ConfigArray} [options.extend] configs extras (ex.: React)
 */
export function createConfig({
  tsconfigRootDir,
  environment = 'node',
  testFiles = ['**/*.spec.ts', 'test/**/*.ts'],
  ignores = [],
  extend = [],
}) {
  return tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules', ...ignores] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: globals[environment],
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        'no-console': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: { arguments: false } },
        ],
      },
    },
    {
      // response.body do supertest (e afins) é any
      files: testFiles,
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    ...extend,
    {
      files: ['**/*.mjs', '**/*.js'],
      extends: [tseslint.configs.disableTypeChecked],
    },
    prettier,
  );
}
