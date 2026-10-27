/** Padrão para ILIKE "contém", escapando os curingas digitados pelo usuário. */
export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, char => `\\${char}`)}%`;
}
