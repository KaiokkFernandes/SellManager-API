import { describe, expect, it } from 'vitest';
import { User } from '../../domain/entities/User';
import { toUserResponse } from './UserMapper';

const apiUrl = 'http://api.test';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    name: 'Kaio',
    email: 'kaio@example.com',
    password: 'hashed-password',
    avatar: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('toUserResponse', () => {
  it('não expõe o hash da senha', () => {
    expect(toUserResponse(makeUser(), apiUrl)).not.toHaveProperty('password');
  });

  it('monta avatar_url quando o usuário tem avatar', () => {
    const response = toUserResponse(makeUser({ avatar: 'abc.png' }), apiUrl);

    expect(response.avatar_url).toBe('http://api.test/files/abc.png');
  });

  it('avatar_url é null quando o usuário não tem avatar', () => {
    expect(toUserResponse(makeUser(), apiUrl).avatar_url).toBeNull();
  });
});
