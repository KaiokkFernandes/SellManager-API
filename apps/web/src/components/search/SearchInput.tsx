import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

interface SearchInputProps {
  /** Valor atual (normalmente vindo da URL). */
  value: string;
  /** Chamado com o termo após o debounce. */
  onSearch: (term: string) => void;
  label: string;
  placeholder?: string;
  delay?: number;
}

/** Campo de busca com debounce; acompanha mudanças externas (voltar no histórico). */
export function SearchInput({
  value,
  onSearch,
  label,
  placeholder,
  delay = 300,
}: SearchInputProps) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  const debounced = useDebouncedValue(text, delay);
  useEffect(() => {
    if (debounced.trim() !== value) onSearch(debounced.trim());
    // só reage ao termo digitado (value vem da URL e já é a fonte de verdade)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={text}
        onChange={event => setText(event.target.value)}
        className="pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          onClick={() => {
            setText('');
            onSearch('');
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          aria-label="Limpar busca"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
