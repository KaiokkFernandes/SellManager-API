import { ROLE_LABELS, type Role } from '@sellmanager/shared';
import { Badge } from '@/components/ui/badge';

const VARIANT = {
  ADMIN: 'destructive',
  MANAGER: 'warning',
  SELLER: 'default',
} as const;

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={VARIANT[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="success">Ativo</Badge>
  ) : (
    <Badge variant="outline">Inativo</Badge>
  );
}
