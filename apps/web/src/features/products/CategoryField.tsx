import { useId } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { FieldShell } from '@/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategoryOptions } from './queries';

// o Radix Select não aceita valor vazio: "sem categoria" vira um valor próprio
const NONE = 'none';

/** Select de categoria ligado ao form; null = sem categoria. */
export function CategoryField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
}: {
  control: Control<TValues, unknown, FieldValues | undefined>;
  name: TName;
}) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  const categories = useCategoryOptions();
  const value = (field.value as string | null | undefined) ?? NONE;

  return (
    <FieldShell id={id} label="Categoria" error={fieldState.error?.message}>
      {aria => (
        <Select
          name={field.name}
          value={value}
          onValueChange={next => field.onChange(next === NONE ? null : next)}
          disabled={categories.isPending}
        >
          <SelectTrigger {...aria} ref={field.ref} onBlur={field.onBlur}>
            <SelectValue placeholder="Carregando…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sem categoria</SelectItem>
            {categories.data?.data.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  );
}
