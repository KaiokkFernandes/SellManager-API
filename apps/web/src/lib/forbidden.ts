import type { Permission } from '@sellmanager/shared';

/** Lançado pelo router quando o papel não tem a permissão da rota (vira a página 403). */
export class ForbiddenError extends Error {
  constructor(readonly permission: Permission) {
    super(`Sem a permissão ${permission}`);
    this.name = 'ForbiddenError';
  }
}
