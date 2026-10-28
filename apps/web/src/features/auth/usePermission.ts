import { can, type Permission } from '@sellmanager/shared';
import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Permissões do usuário logado, pelo MESMO mapa que a API usa
 * (@sellmanager/shared). Só esconde a UI: quem decide de verdade é a API.
 */
export function useCan(): (permission: Permission) => boolean {
  const { user } = useAuth();
  return useCallback(
    (permission: Permission) => (user ? can(user.role, permission) : false),
    [user],
  );
}

export function usePermission(permission: Permission): boolean {
  return useCan()(permission);
}
