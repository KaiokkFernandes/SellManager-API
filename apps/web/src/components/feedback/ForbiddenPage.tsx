import { Link } from '@tanstack/react-router';
import { ShieldX } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-6 text-center">
      <ShieldX className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-5xl font-bold text-muted-foreground">403</p>
      <h1 className="text-xl font-semibold">Acesso não permitido</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Seu perfil não tem permissão para abrir esta página. Se precisar dela,
        fale com um administrador.
      </p>
      <Link to="/" className={buttonVariants()}>
        Ir para o início
      </Link>
    </div>
  );
}
