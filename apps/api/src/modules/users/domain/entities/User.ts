import type { Role } from '@sellmanager/shared';

export type { Role };

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string | null;
  role: Role;
  /** Desativado não entra e perde as sessões abertas (nunca é excluído). */
  active: boolean;
  /** Tokens emitidos antes disto são recusados. */
  password_changed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
