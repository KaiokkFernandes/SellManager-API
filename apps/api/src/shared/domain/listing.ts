import type { SortOrder } from '@sellmanager/shared';

export type { SortOrder };

/** Filtro comum das listagens: busca livre + ordenação por um campo conhecido. */
export interface IListFilter<Sort extends string> {
  search?: string;
  sort?: Sort;
  order?: SortOrder;
}

/** Ordena em memória (repositórios fake), com o id como desempate estável. */
export function sortInMemory<T extends { id: string }>(
  items: T[],
  value: (item: T) => string | number | Date,
  order: SortOrder = 'asc',
): T[] {
  const direction = order === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    const compared =
      typeof left === 'string' && typeof right === 'string'
        ? left.localeCompare(right, 'pt-BR', { sensitivity: 'base' })
        : Number(left) - Number(right);
    return compared * direction || a.id.localeCompare(b.id);
  });
}

/** Busca parcial sem diferenciar maiúsculas/acentos de caixa (fakes). */
export function matchesSearch(search: string | undefined, ...fields: string[]) {
  if (!search) return true;
  const term = search.toLowerCase();
  return fields.some(field => field.toLowerCase().includes(term));
}
