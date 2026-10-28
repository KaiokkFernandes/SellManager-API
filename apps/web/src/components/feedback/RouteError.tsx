import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { getErrorMessage } from '@/lib/apiErrors';
import { ForbiddenError } from '@/lib/forbidden';
import { ForbiddenPage } from './ForbiddenPage';
import { Button } from '@/components/ui/button';

/** Error boundary de rota: mensagem amigável e botão para tentar de novo. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  if (error instanceof ForbiddenError) return <ForbiddenPage />;
  return (
    <div
      role="alert"
      className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {getErrorMessage(error)}
      </p>
      <Button
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        Tentar de novo
      </Button>
    </div>
  );
}
