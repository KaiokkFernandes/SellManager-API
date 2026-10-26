import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { createAppRouter } from './router';

/** Passa a sessão atual ao router e reavalia as rotas quando ela muda. */
export function App({
  router: injected,
}: {
  router?: ReturnType<typeof createAppRouter>;
}) {
  const auth = useAuth();
  const [router] = useState(() => injected ?? createAppRouter());

  // login/logout/401/expiração: re-executa os beforeLoad (redireciona se preciso)
  useEffect(() => {
    void router.invalidate();
  }, [router, auth.isAuthenticated]);

  return <RouterProvider router={router} context={{ auth }} />;
}
