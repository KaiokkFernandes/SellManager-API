import { describe, expect, it } from 'vitest';
import { can, PERMISSIONS, ROLE_PERMISSIONS, ROLES } from './permissions';

describe('permissões', () => {
  it('ADMIN tem todas; MANAGER tudo menos usuários', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toEqual(PERMISSIONS);
    expect(PERMISSIONS.filter(p => !can('MANAGER', p))).toEqual([
      'user:read',
      'user:create',
      'user:update',
    ]);
  });

  it('SELLER não exclui, não altera produto e não cancela pedido', () => {
    for (const permission of PERMISSIONS.filter(p => p.endsWith(':delete'))) {
      expect(can('SELLER', permission)).toBe(false);
    }
    expect(can('SELLER', 'product:update')).toBe(false);
    expect(can('SELLER', 'order:cancel')).toBe(false);
    expect(can('SELLER', 'order:create')).toBe(true);
  });

  it('todo papel referencia só permissões conhecidas, sem repetição', () => {
    for (const role of ROLES) {
      const granted = ROLE_PERMISSIONS[role];
      expect(new Set(granted).size).toBe(granted.length);
      for (const permission of granted)
        expect(PERMISSIONS).toContain(permission);
    }
  });
});
