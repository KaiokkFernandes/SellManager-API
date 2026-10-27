import type { User } from '@sellmanager/api-client';
import type { SessionBody } from '@sellmanager/shared';
import { createContext } from 'react';

/** Como a sessão terminou: decide a mensagem e se o login preserva a rota de origem. */
export type SessionEnd = 'manual' | 'expired' | 'unauthorized';

export interface AuthContextValue {
  /** Usuário logado; null enquanto o perfil carrega ou sem sessão. */
  user: User | null;
  isAuthenticated: boolean;
  /** Motivo do último fim de sessão (null se há sessão ou nunca houve). */
  endedBy: SessionEnd | null;
  login: (credentials: SessionBody) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
