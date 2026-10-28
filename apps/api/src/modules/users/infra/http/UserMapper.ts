import type { User } from '@sellmanager/shared';
import { User as UserEntity } from '../../domain/entities/User';

export type IUserResponse = User;

// Representação pública do usuário: nunca expõe o hash da senha.
export function toUserResponse(
  user: UserEntity,
  apiUrl: string,
): IUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    active: user.active,
    avatar_url: user.avatar ? `${apiUrl}/files/${user.avatar}` : null,
    // mesmo valor que o JSON.stringify de Date já produzia
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}
