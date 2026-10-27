import { ApiClientError } from '@sellmanager/api-client';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row {
  id: string;
  name: string;
}
const columns: Column<Row>[] = [
  { id: 'name', header: 'Nome', cell: row => row.name },
];
const base = {
  columns,
  getRowId: (row: Row) => row.id,
  caption: 'Lista de teste',
};
const meta = { page: 2, limit: 20, total: 45, total_pages: 3 };

describe('DataTable', () => {
  it('renderiza as linhas e a paginação a partir do meta da API', async () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        {...base}
        data={[{ id: '1', name: 'Cabo' }]}
        meta={meta}
        onPageChange={onPageChange}
      />,
    );
    const typing = userEvent.setup();

    expect(
      screen.getByRole('table', { name: 'Lista de teste' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Cabo' })).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3 · 45 itens')).toBeInTheDocument();

    await typing.click(screen.getByRole('button', { name: /Próxima/ }));
    await typing.click(screen.getByRole('button', { name: /Anterior/ }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('desabilita Anterior na primeira página e Próxima na última', () => {
    const { rerender } = render(
      <DataTable
        {...base}
        data={[{ id: '1', name: 'A' }]}
        meta={{ ...meta, page: 1 }}
      />,
    );
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();

    rerender(
      <DataTable
        {...base}
        data={[{ id: '1', name: 'A' }]}
        meta={{ ...meta, page: 3 }}
      />,
    );
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled();
  });

  it('mostra skeleton ao carregar', () => {
    render(<DataTable {...base} data={undefined} isLoading skeletonRows={3} />);
    expect(screen.getAllByRole('row')).toHaveLength(4); // cabeçalho + 3
    expect(
      screen.queryByText('Nenhum registro encontrado.'),
    ).not.toBeInTheDocument();
  });

  it('mostra estado vazio', () => {
    render(<DataTable {...base} data={[]} emptyMessage="Sem produtos." />);
    expect(screen.getByText('Sem produtos.')).toBeInTheDocument();
  });

  it('mostra o erro amigável e permite tentar de novo', async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        {...base}
        data={undefined}
        error={new ApiClientError(0, undefined)}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/conectar ao servidor/);
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('ordena pelo cabeçalho com aria-sort e alterna a direção', async () => {
    const onSortChange = vi.fn();
    const sortable: Column<Row>[] = [{ ...columns[0], sortKey: 'name' }];
    const { rerender } = render(
      <DataTable
        {...base}
        columns={sortable}
        data={[]}
        sort={{ sort: 'name', order: 'asc' }}
        onSortChange={onSortChange}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await userEvent.click(screen.getByRole('button', { name: /Nome/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({
      sort: 'name',
      order: 'desc',
    });

    rerender(
      <DataTable
        {...base}
        columns={sortable}
        data={[]}
        sort={{ sort: 'created_at', order: 'desc' }}
        onSortChange={onSortChange}
      />,
    );
    expect(
      screen.getByRole('columnheader', { name: /Nome/ }),
    ).not.toHaveAttribute('aria-sort');
    await userEvent.click(screen.getByRole('button', { name: /Nome/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({
      sort: 'name',
      order: 'asc',
    });
  });

  it('renderiza cards para o mobile e a chamada para ação no vazio', () => {
    const { rerender } = render(
      <DataTable
        {...base}
        data={[{ id: '1', name: 'Cabo' }]}
        renderCard={row => <p>Card {row.name}</p>}
      />,
    );
    expect(
      screen.getByRole('list', { name: 'Lista de teste' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Card Cabo')).toBeInTheDocument();

    rerender(
      <DataTable
        {...base}
        data={[]}
        emptyAction={<button type="button">Cadastrar o primeiro</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Cadastrar o primeiro' }),
    ).toBeInTheDocument();
  });
});
