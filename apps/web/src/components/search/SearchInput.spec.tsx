import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('chama onSearch uma vez, depois do debounce', async () => {
    const onSearch = vi.fn();
    render(
      <SearchInput
        value=""
        onSearch={onSearch}
        label="Buscar clientes"
        delay={50}
      />,
    );

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar clientes' }),
      'ana',
    );
    expect(onSearch).not.toHaveBeenCalled();

    await act(() => new Promise(resolve => setTimeout(resolve, 80)));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('ana');
  });

  it('acompanha o valor externo (ex.: voltar no histórico) e limpa', async () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <SearchInput value="ana" onSearch={onSearch} label="Buscar" delay={50} />,
    );
    rerender(
      <SearchInput value="bia" onSearch={onSearch} label="Buscar" delay={50} />,
    );
    expect(screen.getByRole('searchbox')).toHaveValue('bia');

    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(onSearch).toHaveBeenCalledWith('');
  });
});
