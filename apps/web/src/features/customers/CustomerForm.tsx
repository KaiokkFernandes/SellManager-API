import { customerBodySchema, type CustomerBody } from '@sellmanager/shared';
import { Loader2 } from 'lucide-react';
import {
  applyApiError,
  Form,
  TextField,
  useUnsavedChangesGuard,
  useZodForm,
} from '@/components/form';
import { Button } from '@/components/ui/button';

interface CustomerFormProps<T> {
  defaultValues?: CustomerBody;
  submitLabel: string;
  /** Salva; erros da API vão para os campos. */
  onSubmit: (values: CustomerBody) => Promise<T>;
  /** Depois de salvar (sem pedir confirmação de saída), com o resultado do onSubmit. */
  onSaved: (result: T) => void;
  onCancel: () => void;
}

/** Mesmo formulário para criar e editar; validação = schema do shared. */
export function CustomerForm<T>({
  defaultValues,
  submitLabel,
  onSubmit,
  onSaved,
  onCancel,
}: CustomerFormProps<T>) {
  const form = useZodForm(customerBodySchema, {
    defaultValues: defaultValues ?? { name: '', email: '' },
  });
  const guard = useUnsavedChangesGuard(form.formState.isDirty);
  const submitting = form.formState.isSubmitting;

  return (
    <Form
      form={form}
      className="max-w-lg"
      onSubmit={async values => {
        try {
          const result = await onSubmit(values);
          guard.allowNavigation();
          onSaved(result);
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
      <TextField
        control={form.control}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          {submitting ? 'Salvando…' : submitLabel}
        </Button>
      </div>
      {guard.dialog}
    </Form>
  );
}
