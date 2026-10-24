import { env } from '@config/env';
import Users from '../typeorm/entities/Users';

export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// Representação pública do usuário: nunca expõe o hash da senha.
export function toUserResponse(user: Users): IUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    avatar_url: user.avatar ? `${env.APP_API_URL}/files/${user.avatar}` : null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
