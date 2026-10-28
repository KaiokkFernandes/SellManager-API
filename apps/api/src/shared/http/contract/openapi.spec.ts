import { describe, expect, it } from 'vitest';
import { generateOpenApiDocument } from './openapi';

type Operation = {
  operationId?: string;
  description?: string;
  security?: unknown[];
  responses: Record<string, unknown>;
};

describe('OpenAPI gerado do contrato', () => {
  const document = generateOpenApiDocument();
  const operations = Object.values(document.paths ?? {}).flatMap(path =>
    Object.values(path as Record<string, Operation>),
  );

  it('documenta todas as operações com operationId único', () => {
    const ids = operations.map(operation => operation.operationId);

    expect(operations).toHaveLength(28);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exige autenticação nas rotas de pedidos', () => {
    expect(document.paths?.['/orders']?.post?.security).toEqual([
      { bearerAuth: [] },
    ]);
  });

  it('declara os erros deduzidos (400 por id inválido, 500 em todas)', () => {
    const showProduct = document.paths?.['/products/{id}']?.get as Operation;

    expect(Object.keys(showProduct.responses).sort()).toEqual([
      '200',
      '400',
      '401',
      '403',
      '404',
      '500',
    ]);
    // quem pode chamar fica documentado
    expect(showProduct.description).toContain(
      'Permissão: `product:read` (ADMIN, MANAGER, SELLER).',
    );
    expect(operations.every(operation => '500' in operation.responses)).toBe(
      true,
    );
  });
});
