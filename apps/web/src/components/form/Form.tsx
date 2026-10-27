import type { ComponentProps } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormProps<
  TIn extends FieldValues,
  TOut extends FieldValues | undefined,
> extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<TIn, unknown, TOut>;
  /** Recebe os valores JÁ validados e convertidos pelo schema. */
  onSubmit: (values: NonNullable<TOut>) => void | Promise<void>;
}

/**
 * <form> ligado ao react-hook-form: valida com o schema, mostra o erro geral
 * (da API) em um alerta e desliga a validação nativa do navegador.
 */
export function Form<
  TIn extends FieldValues,
  TOut extends FieldValues | undefined,
>({ form, onSubmit, className, children, ...props }: FormProps<TIn, TOut>) {
  const serverError = form.formState.errors.root?.server?.message;

  return (
    <form
      noValidate
      className={cn('flex flex-col gap-4', className)}
      onSubmit={event => {
        void form.handleSubmit(values => onSubmit(values as NonNullable<TOut>))(
          event,
        );
      }}
      {...props}
    >
      {serverError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}
      {children}
    </form>
  );
}
