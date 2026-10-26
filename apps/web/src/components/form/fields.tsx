import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { centsToInput, parseCents } from '@/lib/format';

interface BaseFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> {
  control: Control<TValues, unknown, FieldValues | undefined>;
  name: TName;
  label: string;
  description?: string;
}

interface ShellProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: (aria: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

/** Label + controle + descrição + mensagem de erro, com os vínculos de a11y. */
function FieldShell({ id, label, description, error, children }: ShellProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby':
          [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
      })}
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputExtras = Omit<
  ComponentProps<typeof Input>,
  'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'id'
>;

export function TextField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  ...inputProps
}: BaseFieldProps<TValues, TName> & InputExtras) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
    >
      {aria => (
        <Input
          {...inputProps}
          {...aria}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ''}
          onChange={event => field.onChange(event.target.value)}
          onBlur={field.onBlur}
        />
      )}
    </FieldShell>
  );
}

export function TextareaField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  ...props
}: BaseFieldProps<TValues, TName> &
  Omit<
    ComponentProps<typeof Textarea>,
    'name' | 'value' | 'onChange' | 'onBlur' | 'id'
  >) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
    >
      {aria => (
        <Textarea
          {...props}
          {...aria}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ''}
          onChange={event => field.onChange(event.target.value)}
          onBlur={field.onBlur}
        />
      )}
    </FieldShell>
  );
}

/** Número inteiro/decimal. O valor do formulário é `number` (vazio = undefined). */
export function NumberField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  ...inputProps
}: BaseFieldProps<TValues, TName> & Omit<InputExtras, 'type'>) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  const value = field.value as number | undefined;
  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
    >
      {aria => (
        <Input
          inputMode="decimal"
          {...inputProps}
          {...aria}
          name={field.name}
          ref={field.ref}
          type="number"
          value={value === undefined || Number.isNaN(value) ? '' : value}
          onChange={event =>
            field.onChange(
              event.target.value === ''
                ? undefined
                : event.target.valueAsNumber,
            )
          }
          onBlur={field.onBlur}
        />
      )}
    </FieldShell>
  );
}

/**
 * Dinheiro: o usuário digita "1.234,56" e o valor do formulário é em CENTAVOS
 * inteiros (1234 56 -> 123456), o mesmo formato do contrato (`*_cents`).
 */
export function MoneyField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  ...inputProps
}: BaseFieldProps<TValues, TName> & Omit<InputExtras, 'type'>) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  const cents = field.value as number | undefined;
  const [text, setText] = useState(
    cents === undefined ? '' : centsToInput(cents),
  );

  // valores externos do formulário (reset, setValue) atualizam o texto exibido
  const [syncedCents, setSyncedCents] = useState(cents);
  if (!Object.is(cents, syncedCents)) {
    setSyncedCents(cents);
    if (parseCents(text) !== (cents ?? null)) {
      setText(
        cents === undefined || Number.isNaN(cents) ? '' : centsToInput(cents),
      );
    }
  }

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
    >
      {aria => (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
          >
            R$
          </span>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            {...inputProps}
            {...aria}
            className="pl-9"
            name={field.name}
            ref={field.ref}
            value={text}
            onChange={event => {
              setText(event.target.value);
              // texto inválido vira NaN: o schema (int) rejeita e mostra o erro
              field.onChange(
                event.target.value === ''
                  ? undefined
                  : (parseCents(event.target.value) ?? NaN),
              );
            }}
            onBlur={() => {
              const parsed = parseCents(text);
              if (parsed !== null) setText(centsToInput(parsed));
              field.onBlur();
            }}
          />
        </div>
      )}
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  options,
  placeholder = 'Selecione',
  disabled,
}: BaseFieldProps<TValues, TName> & {
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const { field, fieldState } = useController({ control, name });
  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={fieldState.error?.message}
    >
      {aria => (
        <Select
          name={field.name}
          value={field.value ?? ''}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <SelectTrigger {...aria} ref={field.ref} onBlur={field.onBlur}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  );
}
