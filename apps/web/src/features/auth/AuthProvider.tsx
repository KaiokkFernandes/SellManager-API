import { unwrap } from '@sellmanager/api-client';
import type { SessionBody } from '@sellmanager/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setUnauthorizedHandler } from '@/lib/api';
import { getTokenExpiry, isTokenExpired } from '@/lib/jwt';
import { notify } from '@/lib/notify';
import { queryKeys } from '@/lib/queryKeys';
import { tokenStorage } from '@/lib/tokenStorage';
import { profileQueryOptions } from './profileQuery';
import {
  AuthContext,
  type AuthContextValue,
  type SessionEnd,
} from './authContext';

const MAX_TIMEOUT = 2 ** 31 - 1;

const END_MESSAGES: Record<Exclude<SessionEnd, 'manual'>, string> = {
  expired: 'Sua sessão expirou. Entre novamente.',
  unauthorized: 'Sua sessão não é mais válida. Entre novamente.',
};

function initialToken(): string | null {
  const token = tokenStorage.get();
  if (token && isTokenExpired(token)) {
    tokenStorage.clear();
    return null;
  }
  return token;
}

/**
 * Dono do estado de sessão. O token fica no tokenStorage (único acesso ao
 * storage); aqui só o espelhamos no estado para o React re-renderizar. O usuário
 * vem do login ou, após um reload, de GET /profile.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(initialToken);
  const [endedBy, setEndedBy] = useState<SessionEnd | null>(null);

  const endSession = useCallback(
    (reason: SessionEnd) => {
      tokenStorage.clear();
      setToken(null);
      setEndedBy(reason);
      queryClient.clear();
      if (reason !== 'manual') notify.info(END_MESSAGES[reason]);
    },
    [queryClient],
  );

  // 401 de requisição autenticada em qualquer lugar do app
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (tokenStorage.get() !== null) endSession('unauthorized');
    });
    return () => setUnauthorizedHandler(undefined);
  }, [endSession]);

  // logout automático no `exp` do token (e ao voltar para uma aba adormecida)
  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (expiry === null) return;

    const timer = window.setTimeout(
      () => endSession('expired'),
      Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT),
    );
    const checkOnFocus = () => {
      if (isTokenExpired(token)) endSession('expired');
    };
    window.addEventListener('focus', checkOnFocus);
    document.addEventListener('visibilitychange', checkOnFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', checkOnFocus);
      document.removeEventListener('visibilitychange', checkOnFocus);
    };
  }, [token, endSession]);

  // login/logout feito em outra aba
  useEffect(
    () =>
      tokenStorage.subscribe(next => {
        if (next === null) {
          setToken(null);
          setEndedBy('manual');
          queryClient.clear();
        } else {
          setToken(next);
          setEndedBy(null);
        }
      }),
    [queryClient],
  );

  const profile = useQuery({ ...profileQueryOptions, enabled: token !== null });

  const login = useCallback(
    async (credentials: SessionBody) => {
      const session = await unwrap(
        api.POST('/sessions', { body: credentials }),
      );
      tokenStorage.set(session.token);
      queryClient.setQueryData(queryKeys.auth.profile, session.user);
      setEndedBy(null);
      setToken(session.token);
    },
    [queryClient],
  );

  const logout = useCallback(() => endSession('manual'), [endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? (profile.data ?? null) : null,
      isAuthenticated: token !== null,
      endedBy,
      login,
      logout,
    }),
    [token, profile.data, endedBy, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
