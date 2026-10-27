import {
  createOrderBodySchema,
  customerBodySchema,
  productBodySchema,
} from '@sellmanager/shared';
import { describe, expect, it } from 'vitest';
import './zodLocale';

function messages(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map(issue => [
      issue.path.join('.'),
      issue.message,
    ]),
  );
}

describe('mensagens de validação em pt-BR (schemas do shared)', () => {
  it('cliente', () => {
    expect(
      messages(customerBodySchema.safeParse({ name: '  ', email: 'x' })),
    ).toEqual({
      name: 'Campo obrigatório',
      email: 'E-mail inválido',
    });
  });

  it('produto', () => {
    expect(
      messages(
        productBodySchema.safeParse({
          name: 'Cabo',
          price_cents: Number.NaN,
          quantity: -1,
        }),
      ),
    ).toEqual({
      price_cents: 'Informe um número válido',
      quantity: 'Deve ser no mínimo 0',
    });
    expect(
      messages(productBodySchema.safeParse({ name: 'Cabo', quantity: 1.5 })),
    ).toEqual({
      price_cents: 'Campo obrigatório',
      quantity: 'Informe um número inteiro',
    });
  });

  it('pedido', () => {
    expect(
      messages(
        createOrderBodySchema.safeParse({ customer_id: '', products: [] }),
      ),
    ).toEqual({
      customer_id: 'Campo obrigatório',
      products: 'Adicione ao menos um item',
    });
  });
});
