import {
  changePasswordBodySchema,
  ROLE_LABELS,
  updateProfileBodySchema,
} from '@sellmanager/shared';
import { Loader2 } from 'lucide-react';
import {
  applyApiError,
  Form,
  TextField,
  useUnsavedChangesGuard,
  useZodForm,
} from '@/components/form';
import { PageHeader } from '@/components/feedback/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { useChangePassword, useUpdateProfile } from './queries';

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full max-w-lg" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Meu perfil"
        description={`${user.email} · ${ROLE_LABELS[user.role]}`}
      />
      <div className="grid max-w-3xl gap-6">
        <NameCard name={user.name} />
        <PasswordCard />
      </div>
    </>
  );
}

function NameCard({ name }: { name: string }) {
  const update = useUpdateProfile();
  const form = useZodForm(updateProfileBodySchema, { defaultValues: { name } });
  const guard = useUnsavedChangesGuard(form.formState.isDirty);
  const submitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados</CardTitle>
        <CardDescription>
          O e-mail é o seu login e só um administrador altera o papel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          className="max-w-md"
          onSubmit={async values => {
            try {
              const user = await update.mutateAsync(values);
              form.reset({ name: user.name });
            } catch (error) {
              applyApiError(form, error);
            }
          }}
        >
          <TextField
            control={form.control}
            name="name"
            label="Nome"
            autoComplete="name"
          />
          <div>
            <Button
              type="submit"
              disabled={submitting || !form.formState.isDirty}
            >
              {submitting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              Salvar nome
            </Button>
          </div>
          {guard.dialog}
        </Form>
      </CardContent>
    </Card>
  );
}

const EMPTY_PASSWORDS = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

function PasswordCard() {
  const change = useChangePassword();
  // MESMO schema da API: confirmação e "diferente da atual" vêm do shared
  const form = useZodForm(changePasswordBodySchema, {
    defaultValues: EMPTY_PASSWORDS,
  });
  const submitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trocar senha</CardTitle>
        <CardDescription>
          Ao trocar, as sessões abertas em outros dispositivos são encerradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          className="max-w-md"
          onSubmit={async values => {
            try {
              await change.mutateAsync(values);
              form.reset(EMPTY_PASSWORDS);
            } catch (error) {
              applyApiError(form, error);
            }
          }}
        >
          <TextField
            control={form.control}
            name="current_password"
            label="Senha atual"
            type="password"
            autoComplete="current-password"
          />
          <TextField
            control={form.control}
            name="password"
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            description="De 8 a 72 caracteres."
          />
          <TextField
            control={form.control}
            name="password_confirmation"
            label="Confirme a nova senha"
            type="password"
            autoComplete="new-password"
          />
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {submitting ? 'Trocando…' : 'Trocar senha'}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
