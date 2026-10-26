import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        O endereço não existe ou foi movido.
      </p>
      <Link to="/" className={buttonVariants()}>
        Ir para o início
      </Link>
    </div>
  );
}
