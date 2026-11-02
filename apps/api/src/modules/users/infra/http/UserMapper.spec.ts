import { describe, expect, it } from 'vitest';
import { User } from '../../domain/entities/User';
import { toUserResponse } from './UserMapper';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    name: 'Kaio',
    email: 'kaio@example.com',
    password: 'hashed-password',
    avatar: null,
    role: 'SELLER',
    active: true,
    password_changed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('toUserResponse', () => {
  it('não expõe o hash da senha', () => {
    expect(toUserResponse(makeUser())).not.toHaveProperty('password');
  });

  it('avatar_url é a URL pública guardada no banco', () => {
    const url = 'https://blob.test/abc.png';

    expect(toUserResponse(makeUser({ avatar: url })).avatar_url).toBe(url);
  });

  it('avatar_url é null quando o usuário não tem avatar', () => {
    expect(toUserResponse(makeUser()).avatar_url).toBeNull();
  });
});
