import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { permissionsTable, withPermissionsTable } from './permissionsTable';

describe('matriz de permissões do README', () => {
  it('está em dia com o mapa do shared (rode: pnpm --filter api docs:permissions)', () => {
    const readme = readFileSync(
      path.resolve(__dirname, '..', '..', '..', '..', '..', 'README.md'),
      'utf-8',
    );
    expect(withPermissionsTable(readme)).toBe(readme);
  });

  it('marca quem tem cada permissão e as rotas protegidas', () => {
    const table = permissionsTable();
    expect(table).toContain(
      '| `order:cancel` | ✅ | ✅ | — | `PATCH /orders/{id}/cancel` |',
    );
    expect(table).toContain(
      '| `report:read` | ✅ | ✅ | — | `GET /reports/sales`, `GET /reports/products`, `GET /reports/customers` |',
    );
  });
});
