// Atualiza a matriz de permissões no README raiz a partir do mapa do shared.
/* eslint-disable no-console -- script de linha de comando */
// Uso: tsx scripts/permissions-doc.ts
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { withPermissionsTable } from '../src/shared/docs/permissionsTable';

const file = path.resolve(__dirname, '..', '..', '..', 'README.md');
writeFileSync(file, withPermissionsTable(readFileSync(file, 'utf-8')));
console.log('Matriz de permissões atualizada no README.md.');
