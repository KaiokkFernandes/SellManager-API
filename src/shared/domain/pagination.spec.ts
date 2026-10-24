import { describe, expect, it } from 'vitest';
import { paginate, slicePage, toSkipTake } from './pagination';

describe('pagination', () => {
  it('converte página em skip/take', () => {
    expect(toSkipTake({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
  });

  it('monta meta com total de páginas', () => {
    const result = paginate(slicePage([1, 2, 3, 4, 5], { page: 2, limit: 2 }), {
      page: 2,
      limit: 2,
    });

    expect(result).toEqual({
      data: [3, 4],
      meta: { page: 2, limit: 2, total: 5, total_pages: 3 },
    });
  });
});
