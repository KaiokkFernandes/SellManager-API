import { allRoutes, can, PERMISSIONS, ROLES } from '@sellmanager/shared';

export const README_START = '<!-- permissions:start -->';
export const README_END = '<!-- permissions:end -->';

/**
 * Matriz papel × permissão em Markdown, gerada do mapa e do contrato de
 * @sellmanager/shared (com as rotas que cada permissão protege).
 */
export function permissionsTable(): string {
  const header = `| Permission | ${ROLES.join(' | ')} | Routes |`;
  const divider = `| --- | ${ROLES.map(() => ':-:').join(' | ')} | --- |`;
  const rows = PERMISSIONS.map(permission => {
    const routes = allRoutes
      .filter(route => route.auth && route.permission === permission)
      .map(route => `\`${route.method.toUpperCase()} ${route.path}\``);
    const marks = ROLES.map(role => (can(role, permission) ? '✅' : '—'));
    return `| \`${permission}\` | ${marks.join(' | ')} | ${routes.join(', ') || '_reserved_'} |`;
  });
  const anyUser = allRoutes
    .filter(route => route.auth && route.permission === 'authenticated')
    .map(route => `\`${route.method.toUpperCase()} ${route.path}\``);
  return [
    header,
    divider,
    ...rows,
    '',
    `Any signed-in user: ${anyUser.join(', ')}.`,
  ].join('\n');
}

/** Substitui o bloco entre os marcadores do README pela matriz atual. */
export function withPermissionsTable(readme: string): string {
  const start = readme.indexOf(README_START);
  const end = readme.indexOf(README_END);
  if (start < 0 || end < start) {
    throw new Error(`README sem os marcadores ${README_START} / ${README_END}`);
  }
  // prettier-ignore: a tabela é gerada; o Prettier não deve realinhá-la
  const block = [
    '<!-- prettier-ignore-start -->',
    '',
    permissionsTable(),
    '',
    '<!-- prettier-ignore-end -->',
  ].join('\n');
  return `${readme.slice(0, start + README_START.length)}\n${block}\n${readme.slice(end)}`;
}
