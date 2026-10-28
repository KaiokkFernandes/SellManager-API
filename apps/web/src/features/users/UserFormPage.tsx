import type { User } from '@sellmanager/api-client';
import {
  createUserBodySchema,
  ROLE_LABELS,
  ROLES,
  updateUserBodySchema,
} from '@sellmanager/shared';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Loader2, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';
import {
  applyApiError,
  Form,
  SelectField,
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
import { getAdminGuardMessage, getErrorMessage } from '@/lib/apiErrors';
import { useCreateUser, useUpdateUser, useUser } from './queries';
import { StatusBadge } from './RoleBadge';
import { UserStatusDialog } from './UserStatusDialog';

const ROLE_OPTIONS = ROLES.map(role => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export function NewUserPage() {
  const navigate = useNavigate();
  const create = useCreateUser();
  const form = useZodForm(createUserBodySchema, {
    defaultValues: { name: '', email: '', password: '', role: 'SELLER' },
  });
  const guard = useUnsavedChangesGuard(form.formState.isDirty);
  const submitting = form.formState.isSubmitting;
  const toList = () => void navigate({ to: '/users' });

  return (
    <>
      <PageHeader
        title="Novo usuário"
        description="Defina uma senha inicial e repasse à pessoa."
      />
      <Card>
        <CardContent className="pt-6">
          <Form
            form={form}
            className="max-w-lg"
            onSubmit={async values => {
              try {
                await create.mutateAsync(values);
                guard.allowNavigation();
                toList();
              } catch (error) {
                applyApiError(form, error);
              }
            }}
          >
            <TextField
              control={form.control}
              name="name"
              label="Nome"
              autoComplete="off"
            />
            <TextField
              control={form.control}
              name="email"
              label="E-mail"
              type="email"
              autoComplete="off"
            />
            <SelectField
              control={form.control}
              name="role"
              label="Papel"
              options={ROLE_OPTIONS}
            />
            <TextField
              control={form.control}
              name="password"
              label="Senha inicial"
              type="password"
              autoComplete="new-password"
              description="De 8 a 72 caracteres. A pessoa pode trocá-la em Meu perfil."
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={toList}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                {submitting ? 'Salvando…' : 'Cadastrar usuário'}
              </Button>
            </div>
            {guard.dialog}
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

const editRoute = getRouteApi('/authenticated/users/$userId/edit');

export function EditUserPage() {
  const { userId } = editRoute.useParams();
  const user = useUser(userId);

  if (user.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full max-w-lg" />
      </div>
    );
  }
  if (user.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(user.error)}
        </p>
        <Button variant="outline" size="sm" onClick={() => void user.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  return <EditUserForm user={user.data} />;
}

function EditUserForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isSelf = me?.id === user.id;
  const update = useUpdateUser(user.id);
  const [toggling, setToggling] = useState(false);
  const form = useZodForm(updateUserBodySchema, {
    defaultValues: { name: user.name, role: user.role },
  });
  const guard = useUnsavedChangesGuard(form.formState.isDirty);
  const submitting = form.formState.isSubmitting;
  const toList = () => void navigate({ to: '/users' });

  return (
    <>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={<StatusBadge active={user.active} />}
      />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados e papel</CardTitle>
            <CardDescription>O e-mail é o login e não muda.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              form={form}
              className="max-w-lg"
              onSubmit={async values => {
                try {
                  await update.mutateAsync(values);
                  guard.allowNavigation();
                  toList();
                } catch (error) {
                  const guardMessage = getAdminGuardMessage(error);
                  if (guardMessage) {
                    form.setError('role', {
                      type: 'server',
                      message: guardMessage,
                    });
                  } else {
                    applyApiError(form, error);
                  }
                }
              }}
            >
              <TextField
                control={form.control}
                name="name"
                label="Nome"
                autoComplete="off"
              />
              <SelectField
                control={form.control}
                name="role"
                label="Papel"
                options={ROLE_OPTIONS}
                disabled={isSelf}
                description={
                  isSelf ? 'Você não pode alterar o próprio papel.' : undefined
                }
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={toList}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {submitting ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </div>
              {guard.dialog}
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso</CardTitle>
            <CardDescription>
              {user.active
                ? 'Desativar tira o acesso na hora, sem excluir nada.'
                : 'Usuário desativado: não consegue entrar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSelf ? (
              <p className="text-sm text-muted-foreground">
                Você não pode desativar a si mesmo.
              </p>
            ) : (
              <Button
                variant={user.active ? 'outline' : 'default'}
                onClick={() => setToggling(true)}
              >
                {user.active ? (
                  <PowerOff aria-hidden="true" />
                ) : (
                  <Power aria-hidden="true" />
                )}
                {user.active ? 'Desativar usuário' : 'Reativar usuário'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <UserStatusDialog
        user={toggling ? user : null}
        onOpenChange={setToggling}
      />
    </>
  );
}
