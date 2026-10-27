import { sessionBodySchema } from '@sellmanager/shared';
import { getRouteApi } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { applyApiError, Form, TextField, useZodForm } from '@/components/form';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ApiClientError } from '@sellmanager/api-client';
import { safeRedirect } from '@/lib/safeRedirect';
import { useAuth } from './useAuth';

const route = getRouteApi('/login');

export function LoginPage() {
  const { login } = useAuth();
  const navigate = route.useNavigate();
  const { redirect } = route.useSearch();

  // MESMO schema da API (packages/shared): sem regras duplicadas no front
  const form = useZodForm(sessionBodySchema, {
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: { email: string; password: string }) {
    try {
      await login(values);
      await navigate({ href: safeRedirect(redirect) ?? '/', replace: true });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        form.setError('root.server', {
          type: 'server',
          message: 'E-mail ou senha incorretos.',
        });
      } else {
        applyApiError(form, error);
      }
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Entrar no SellManager</CardTitle>
          <CardDescription>
            Use seu e-mail e senha para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <TextField
              control={form.control}
              name="email"
              label="E-mail"
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
