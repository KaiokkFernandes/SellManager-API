import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors';

/**
 * Leva um erro da API para o formulário: erros de validação por campo vão para
 * o campo; o restante vira o erro geral (`root.server`), exibido pelo <Form>.
 */
export function applyApiError<
  TIn extends FieldValues,
  TOut extends FieldValues | undefined,
>(form: UseFormReturn<TIn, unknown, TOut>, error: unknown): void {
  const fieldErrors = getFieldErrors(error);
  const known = Object.entries(fieldErrors).filter(
    ([name]) => name in form.getValues(),
  );

  for (const [name, message] of known) {
    form.setError(name as Path<TIn>, { type: 'server', message });
  }
  if (known.length === 0 || known.length < Object.keys(fieldErrors).length) {
    form.setError('root.server', {
      type: 'server',
      message: getErrorMessage(error),
    });
  }
}
