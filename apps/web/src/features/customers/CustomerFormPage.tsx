import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { PageHeader } from '@/components/feedback/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/apiErrors';
import { CustomerForm } from './CustomerForm';
import { useCreateCustomer, useCustomer, useUpdateCustomer } from './queries';

export function NewCustomerPage() {
  const navigate = useNavigate();
  const create = useCreateCustomer();

  return (
    <>
      <PageHeader title="Novo cliente" />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm
            submitLabel="Cadastrar cliente"
            onSubmit={values => create.mutateAsync(values)}
            onSaved={created =>
              void navigate({
                to: '/customers/$customerId',
                params: { customerId: created.id },
              })
            }
            onCancel={() => void navigate({ to: '/customers' })}
          />
        </CardContent>
      </Card>
    </>
  );
}

const editRoute = getRouteApi('/authenticated/customers/$customerId/edit');

export function EditCustomerPage() {
  const { customerId } = editRoute.useParams();
  const navigate = useNavigate();
  const customer = useCustomer(customerId);
  const update = useUpdateCustomer(customerId);
  const back = () =>
    void navigate({ to: '/customers/$customerId', params: { customerId } });

  return (
    <>
      <PageHeader title="Editar cliente" />
      <Card>
        <CardContent className="pt-6">
          {customer.isPending ? (
            <div className="max-w-lg space-y-4" aria-busy="true">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : customer.isError ? (
            <div role="alert" className="space-y-3">
              <p className="text-sm text-destructive">
                {getErrorMessage(customer.error)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void customer.refetch()}
              >
                Tentar de novo
              </Button>
            </div>
          ) : (
            <CustomerForm
              defaultValues={{
                name: customer.data.name,
                email: customer.data.email,
              }}
              submitLabel="Salvar alterações"
              onSubmit={values => update.mutateAsync(values)}
              onSaved={back}
              onCancel={back}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
