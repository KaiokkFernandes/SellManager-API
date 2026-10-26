import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues,
  type Resolver, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

/**
 * react-hook-form já validando com um schema zod. Use SEMPRE schemas de
 * `@sellmanager/shared`: não redefina regras de validação no front.
 */
export function useZodForm<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
  options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, 'resolver'>,
): UseFormReturn<z.input<S>, unknown, z.output<S>> {
  return useForm<z.input<S>, unknown, z.output<S>>({
    ...options,
    // o resolver é tipado de forma genérica; os tipos reais vêm de z.input/z.output
    resolver: zodResolver(schema) as unknown as Resolver<z.input<S>, unknown, z.output<S>>,
  });
}
