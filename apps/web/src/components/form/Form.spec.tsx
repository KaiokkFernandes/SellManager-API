import { ApiClientError } from '@sellmanager/api-client';
import { productBodySchema } from '@sellmanager/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  applyApiError,
  Form,
  MoneyField,
  NumberField,
  TextField,
  useZodForm,
} from '.';

function ProductForm({
  onSubmit,
  failWith,
}: {
  onSubmit: (values: unknown) => void;
  failWith?: unknown;
}) {
  const form = useZodForm(productBodySchema, { defaultValues: { name: '' } });
  return (
    <Form
      form={form}
      onSubmit={values => {
        if (failWith) return applyApiError(form, failWith);
        onSubmit(values);
      }}
    >
      <TextField control={form.control} name="name" label="Nome" />
      <MoneyField control={form.control} name="price_cents" label="Preço" />
      <NumberField control={form.control} name="quantity" label="Quantidade" />
      <button type="submit">Salvar</button>
    </Form>
  );
}

async function fill(name: string, price: string, quantity: string) {
  const typing = userEvent.setup();
  await typing.type(screen.getByLabelText('Nome'), name);
  await typing.type(screen.getByLabelText('Preço'), price);
  await typing.type(screen.getByLabelText('Quantidade'), quantity);
  await typing.click(screen.getByRole('button', { name: 'Salvar' }));
  return typing;
}

describe('formulário com schema do shared', () => {
  it('envia dinheiro em centavos inteiros e os demais valores já convertidos', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await fill('Cabo', '1.234,56', '3');

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Cabo',
      price_cents: 123456,
      quantity: 3,
    });
  });

  it('mostra os erros do schema vinculados aos campos (aria)', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    const name = screen.getByLabelText('Nome');
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription(/.+/);
  });

  it('rejeita preço inválido em vez de enviar lixo', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await fill('Cabo', 'abc', '1');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Preço')).toBeInvalid();
  });

  it('leva erros da API para os campos e o restante para o alerta geral', async () => {
    const error = new ApiClientError(400, {
      status: 'error',
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      issues: [{ segment: 'body', path: 'name', message: 'Nome já existe' }],
    });
    render(<ProductForm onSubmit={vi.fn()} failWith={error} />);

    await fill('Cabo', '10', '1');

    expect(await screen.findByText('Nome já existe')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInvalid();
  });

  it('mostra erro geral amigável para erros sem campo', async () => {
    render(
      <ProductForm
        onSubmit={vi.fn()}
        failWith={new ApiClientError(0, undefined)}
      />,
    );

    await fill('Cabo', '10', '1');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /conectar ao servidor/,
    );
  });
});
