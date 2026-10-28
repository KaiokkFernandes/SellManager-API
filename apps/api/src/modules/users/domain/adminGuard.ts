import AppError from '@shared/errors/AppError';
import { Role, User } from './entities/User';

export type AdminGuardReason = 'SELF' | 'LAST_ADMIN';

function refuse(message: string, reason: AdminGuardReason): AppError {
  return new AppError(message, 409, { code: 'CONFLICT', details: { reason } });
}

/**
 * Regras de governança: ninguém rebaixa ou desativa a si mesmo, e o sistema
 * nunca fica sem um ADMIN ativo. `activeAdminIds` deve vir travado (lock).
 */
export function assertAdminChangeAllowed({
  actorId,
  target,
  next,
  activeAdminIds,
}: {
  actorId: string;
  target: User;
  next: { role: Role; active: boolean };
  activeAdminIds: readonly string[];
}): void {
  const demotes = target.role !== next.role;
  const deactivates = target.active && !next.active;
  if (!demotes && !deactivates) return;

  if (target.id === actorId) {
    throw refuse(
      deactivates
        ? 'You cannot deactivate yourself'
        : 'You cannot change your own role',
      'SELF',
    );
  }

  const losesAdmin =
    target.role === 'ADMIN' &&
    target.active &&
    (next.role !== 'ADMIN' || !next.active);
  if (
    losesAdmin &&
    activeAdminIds.filter(id => id !== target.id).length === 0
  ) {
    throw refuse(
      'The last active admin cannot be demoted or deactivated',
      'LAST_ADMIN',
    );
  }
}
