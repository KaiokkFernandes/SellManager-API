import { productBodySchema, type ProductBody } from '@sellmanager/shared';
import { Loader2 } from 'lucide-react';
import {
  applyApiError,
  Form,
  MoneyField,
  NumberField,
  TextField,
  useUnsavedChangesGuard,
  useZodForm,
} from '@/components/form';
import { Button } from '@/components/ui/button';

interface ProductFormProps<T> {
  defaultValues?: ProductBody;
  submitLabel: string;
  onSubmit: (values: ProductBody) => Promise<T>;
  onSaved: (result: T) => void;
  onCancel: () => void;
}

/** Criar e editar. Preço em centavos (MoneyField), validação = schema do shared. */
export function ProductForm<T>({
  defaultValues,
  submitLabel,
  onSubmit,
  onSaved,
  onCancel,
}: ProductFormProps<T>) {
  const form = useZodForm(productBodySchema, {
    defaultValues: defaultValues ?? { name: '' },
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
          form.reset(values);
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
        autoComplete="off"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField control={form.control} name="price_cents" label="Preço" />
        <NumberField
          control={form.control}
          name="quantity"
          label="Estoque"
          min={0}
          step={1}
          inputMode="numeric"
          description="Unidades disponíveis"
        />
      </div>
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
