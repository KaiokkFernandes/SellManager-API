// Gera apps/api/openapi.json a partir do contrato de @sellmanager/shared.
/* eslint-disable no-console -- script de linha de comando */
// Uso: tsx scripts/generate-openapi.ts [--check]
//   --check  não grava; falha (exit 1) se o arquivo commitado estiver desatualizado
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { generateOpenApiDocument } from '../src/shared/http/contract/openapi';

const file = path.resolve(__dirname, '..', 'openapi.json');
const document: { paths?: object } = generateOpenApiDocument();
const content = `${JSON.stringify(document, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(file) ? readFileSync(file, 'utf-8') : '';
  if (current !== content) {
    console.error(
      'openapi.json está desatualizado em relação ao contrato. Rode: pnpm --filter api openapi:generate',
    );
    process.exit(1);
  }
  console.log('openapi.json em dia com o contrato.');
} else {
  writeFileSync(file, content);
  console.log(
    `openapi.json gerado (${Object.keys(document.paths ?? {}).length} paths).`,
  );
}
