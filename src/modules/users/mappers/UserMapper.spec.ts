import { describe, expect, it } from 'vitest';
import Users from '../typeorm/entities/Users';
import { toUserResponse } from './UserMapper';

function makeUser(overrides: Partial<Users> = {}): Users {
  return Object.assign(new Users(), {
    id: 'user-id',
    name: 'Kaio',
    email: 'kaio@example.com',
    password: 'hashed-password',
    avatar: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });
}

describe('toUserResponse', () => {
  it('não expõe o hash da senha', () => {
    const response = toUserResponse(makeUser());

    expect(response).not.toHaveProperty('password');
  });

  it('monta avatar_url quando o usuário tem avatar', () => {
    const response = toUserResponse(makeUser({ avatar: 'abc.png' }));

    expect(response.avatar_url).toMatch(/\/files\/abc\.png$/);
  });

  it('avatar_url é null quando o usuário não tem avatar', () => {
    expect(toUserResponse(makeUser()).avatar_url).toBeNull();
  });
});
