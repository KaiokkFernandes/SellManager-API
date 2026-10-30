import type { MetricsPreset } from '@sellmanager/shared';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PeriodSearch } from './periodSearch';

const PRESETS: { value: Exclude<MetricsPreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'month', label: 'Mês atual' },
];

/** Presets e período personalizado (métricas e relatórios); tudo vai para a URL. */
export function PeriodPicker({
  value,
  onChange,
}: {
  value: PeriodSearch;
  onChange: (next: PeriodSearch) => void;
}) {
  const active = value.preset ?? '30d';
  const [from, setFrom] = useState(value.from ?? '');
  const [to, setTo] = useState(value.to ?? '');
  const [custom, setCustom] = useState(active === 'custom');
  const fromId = useId();
  const toId = useId();
  const invalid = Boolean(from && to && to < from);

  return (
    <div className="mb-6 space-y-3">
      <div
        role="group"
        aria-label="Período"
        className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 sm:inline-flex"
      >
        {PRESETS.map(preset => (
          <Button
            key={preset.value}
            size="sm"
            variant="ghost"
            aria-pressed={!custom && active === preset.value}
            className={cn(
              !custom &&
                active === preset.value &&
                'bg-background shadow-sm hover:bg-background',
            )}
            onClick={() => {
              setCustom(false);
              onChange({ preset: preset.value });
            }}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={custom}
          className={cn(
            custom && 'bg-background shadow-sm hover:bg-background',
          )}
          onClick={() => setCustom(true)}
        >
          Personalizado
        </Button>
      </div>
      {custom ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={event => {
            event.preventDefault();
            if (from && to && !invalid)
              onChange({ preset: 'custom', from, to });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fromId}>De</Label>
            <Input
              id={fromId}
              type="date"
              value={from}
              onChange={event => setFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={toId}>Até</Label>
            <Input
              id={toId}
              type="date"
              value={to}
              min={from}
              aria-invalid={invalid}
              onChange={event => setTo(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={!from || !to || invalid}>
            Aplicar
          </Button>
          {invalid ? (
            <p role="alert" className="basis-full text-sm text-destructive">
              A data final deve ser igual ou posterior à inicial.
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
