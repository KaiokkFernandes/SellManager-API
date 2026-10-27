import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxProps<T> {
  /** Item selecionado (null = nenhum). */
  value: T | null;
  onChange: (item: T) => void;
  /** Resultados da busca atual (vindos do servidor). */
  items: readonly T[] | undefined;
  isLoading?: boolean;
  /** Termo digitado: quem usa busca no servidor (com debounce) e passa `items`. */
  onSearchChange: (term: string) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  /** Conteúdo extra da opção (ex.: preço e estoque). */
  renderItem?: (item: T) => ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  /** Rótulo acessível quando não há <label htmlFor> (ex.: "Adicionar produto"). */
  'aria-label'?: string;
  className?: string;
}

/**
 * Seleção com busca no servidor. Teclado: Enter/Espaço abre, setas navegam,
 * Enter escolhe, Esc fecha e devolve o foco ao botão (cmdk + Radix Popover).
 */
export function Combobox<T>({
  value,
  onChange,
  items,
  isLoading,
  onSearchChange,
  getKey,
  getLabel,
  renderItem,
  placeholder = 'Selecione',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Nada encontrado.',
  disabled,
  id,
  className,
  ...aria
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const listId = useId();

  function changeTerm(next: string) {
    setTerm(next);
    onSearchChange(next);
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) changeTerm('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal aria-invalid:border-destructive',
            !value && 'text-muted-foreground',
            className,
          )}
          {...aria}
        >
          <span className="truncate">
            {value ? getLabel(value) : placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command shouldFilter={false} label={aria['aria-label'] ?? placeholder}>
          <div className="flex items-center border-b px-3">
            <Command.Input
              value={term}
              onValueChange={changeTerm}
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isLoading ? (
              <Loader2
                className="size-4 animate-spin opacity-60"
                aria-label="Carregando"
              />
            ) : null}
          </div>
          <Command.List id={listId} className="max-h-64 overflow-y-auto p-1">
            {!isLoading && items?.length === 0 ? (
              <Command.Empty className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </Command.Empty>
            ) : null}
            {items?.map(item => {
              const key = getKey(item);
              const selected = value !== null && getKey(value) === key;
              return (
                <Command.Item
                  key={key}
                  value={key}
                  onSelect={() => {
                    onChange(item);
                    setOpen(false);
                    changeTerm('');
                  }}
                  className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      selected ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{getLabel(item)}</div>
                    {renderItem ? (
                      <div className="text-xs text-muted-foreground">
                        {renderItem(item)}
                      </div>
                    ) : null}
                  </div>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
