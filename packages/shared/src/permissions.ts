import { z } from 'zod';

/**
 * Controle de acesso por papel. FONTE ÚNICA: a API autoriza cada rota com este
 * mapa, o front esconde menus/botões com ele e os testes da matriz são gerados
 * a partir dele. Mudou aqui, mudou em todo lugar.
 */
export const ROLES = ['ADMIN', 'MANAGER', 'SELLER'] as const;
export type Role = (typeof ROLES)[number];
export const roleSchema = z.enum(ROLES);

export const PERMISSIONS = [
  'customer:read',
  'customer:create',
  'customer:update',
  'customer:delete',
  'product:read',
  'product:create',
  'product:update',
  'product:delete',
  'category:create',
  'category:update',
  'category:delete',
  'stock:read',
  'stock:adjust',
  'order:read',
  'order:create',
  'order:pay',
  'order:ship',
  'order:deliver',
  'order:cancel',
  'dashboard:read',
  'report:read',
  'user:read',
  'user:create',
  'user:update',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const MANAGER_PERMISSIONS = PERMISSIONS.filter(
  permission => !permission.startsWith('user:'),
);

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  // tudo, inclusive gerenciar usuários
  ADMIN: PERMISSIONS,
  // clientes, produtos, pedidos e relatórios
  MANAGER: MANAGER_PERMISSIONS,
  // vende: vê produtos, cadastra clientes, cria pedidos e registra o pagamento;
  // no dashboard vê só os próprios números (sem report:read);
  // não exclui nada, não mexe em preço/estoque, não envia/entrega nem cancela
  SELLER: [
    'dashboard:read',
    'customer:read',
    'customer:create',
    'product:read',
    'order:read',
    'order:create',
    'order:pay',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Nomes para exibição (front e documentação). */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
};
