import { describe, expect, it } from 'vitest';
import { generateOpenApiDocument } from './openapi';

describe('OpenAPI', () => {
  const document = generateOpenApiDocument('http://api.test');

  it('documenta todas as operações com operationId único', () => {
    const operations = Object.values(document.paths ?? {}).flatMap(path =>
      Object.values(path as Record<string, { operationId?: string }>),
    );
    const ids = operations.map(operation => operation.operationId);

    expect(operations).toHaveLength(22);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exige autenticação nas rotas de pedidos', () => {
    expect(document.paths?.['/orders']?.post?.security).toEqual([
      { bearerAuth: [] },
    ]);
  });
});
