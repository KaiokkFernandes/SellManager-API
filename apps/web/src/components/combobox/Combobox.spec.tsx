import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

interface Fruit {
  id: string;
  name: string;
}
const fruits: Fruit[] = [
  { id: '1', name: 'Banana' },
  { id: '2', name: 'Maçã' },
  { id: '3', name: 'Manga' },
];

function Harness({ onSearch }: { onSearch: (term: string) => void }) {
  const [value, setValue] = useState<Fruit | null>(null);
  const [term, setTerm] = useState('');
  return (
    <Combobox
      aria-label="Fruta"
      value={value}
      onChange={setValue}
      items={fruits.filter(fruit =>
        fruit.name.toLowerCase().includes(term.toLowerCase()),
      )}
      onSearchChange={next => {
        setTerm(next);
        onSearch(next);
      }}
      getKey={fruit => fruit.id}
      getLabel={fruit => fruit.name}
      placeholder="Escolha uma fruta"
    />
  );
}

describe('Combobox', () => {
  it('é operável só pelo teclado: abre, busca, navega e escolhe', async () => {
    const onSearch = vi.fn();
    render(<Harness onSearch={onSearch} />);
    const typing = userEvent.setup();
    const trigger = screen.getByRole('combobox', { name: 'Fruta' });

    trigger.focus();
    await typing.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await typing.keyboard('ma');
    expect(onSearch).toHaveBeenLastCalledWith('ma');
    expect(
      screen.getAllByRole('option').map(option => option.textContent),
    ).toEqual(['Maçã', 'Manga']);

    await typing.keyboard('{ArrowDown}{Enter}');

    expect(trigger).toHaveTextContent('Manga');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('Esc fecha sem escolher e mostra estado vazio', async () => {
    render(<Harness onSearch={vi.fn()} />);
    const typing = userEvent.setup();

    await typing.click(screen.getByRole('combobox', { name: 'Fruta' }));
    await typing.keyboard('xyz');
    expect(screen.getByText('Nada encontrado.')).toBeInTheDocument();

    await typing.keyboard('{Escape}');
    expect(screen.getByRole('combobox', { name: 'Fruta' })).toHaveTextContent(
      'Escolha uma fruta',
    );
  });
});
