import type { Customer, Product } from '@sellmanager/api-client';
import {
  createOrderBodySchema,
  type CreateOrderBody,
} from '@sellmanager/shared';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Combobox } from '@/components/combobox';
import { PageHeader } from '@/components/feedback/PageHeader';
import {
  applyApiError,
  FieldShell,
  Form,
  useUnsavedChangesGuard,
  useZodForm,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCents } from '@/lib/format';
import {
  useCreateOrder,
  useCustomerById,
  useCustomerOptions,
  useProductOptions,
} from './queries';
import { getMissingProductIds, getStockShortages } from './stockErrors';

const route = getRouteApi('/authenticated/orders/new');

export function NewOrderPage() {
  const { customer_id: preselectedId } = route.useSearch();
  const navigate = useNavigate();
  const create = useCreateOrder();
  const preselected = useCustomerById(preselectedId);

  const form = useZodForm(createOrderBodySchema, {
    defaultValues: { customer_id: preselectedId ?? '', products: [] },
  });
  // keyName: o item do contrato já tem um campo `id` (o do produto)
  const lines = useFieldArray({
    control: form.control,
    name: 'products',
    keyName: 'key',
  });
  const watched = useWatch({ control: form.control, name: 'products' });
  const guard = useUnsavedChangesGuard(form.formState.isDirty);
  const submitting = form.formState.isSubmitting;

  // dados de exibição dos produtos escolhidos (nome, preço, estoque conhecido)
  const [catalog, setCatalog] = useState<Record<string, Product>>({});
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerTerm, setCustomerTerm] = useState('');
  const [productTerm, setProductTerm] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const customers = useCustomerOptions(customerTerm);
  const products = useProductOptions(productTerm);
  const totalId = useId();

  const selectedCustomer =
    customer ??
    (preselected.data?.id === preselectedId
      ? (preselected.data ?? null)
      : null);
  const total = watched.reduce(
    (sum, line) =>
      sum + (catalog[line.id]?.price_cents ?? 0) * (Number(line.quantity) || 0),
    0,
  );

  function addProduct(product: Product) {
    setCatalog(current => ({ ...current, [product.id]: product }));
    const index = watched.findIndex(line => line.id === product.id);
    if (index >= 0) {
      // produto já está no pedido: soma em vez de duplicar a linha
      const quantity = (Number(watched[index]?.quantity) || 0) + 1;
      form.setValue(`products.${index}.quantity`, quantity, {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      });
      setAnnouncement(
        `${product.name}: quantidade aumentada para ${quantity}.`,
      );
    } else {
      lines.append({ id: product.id, quantity: 1 });
      setAnnouncement(`${product.name} adicionado ao pedido.`);
    }
  }

  function changeQuantity(index: number, quantity: number | undefined) {
    form.setValue(`products.${index}.quantity`, quantity as number, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  }

  async function submit(values: CreateOrderBody) {
    try {
      const order = await create.mutateAsync(values);
      guard.allowNavigation();
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
    } catch (error) {
      const shortages = getStockShortages(error);
      const missing = getMissingProductIds(error);
      if (shortages.length === 0 && missing.length === 0)
        return applyApiError(form, error);

      // aponta as linhas afetadas e atualiza o estoque conhecido com o da API
      for (const { product_id, available } of shortages) {
        const index = values.products.findIndex(line => line.id === product_id);
        const product = catalog[product_id];
        if (product)
          setCatalog(current => ({
            ...current,
            [product_id]: { ...product, quantity: available },
          }));
        if (index >= 0) {
          form.setError(`products.${index}.quantity`, {
            type: 'server',
            message:
              available === 0
                ? 'Sem estoque no momento.'
                : `Estoque insuficiente: só há ${available} disponível(is).`,
          });
        }
      }
      for (const id of missing) {
        const index = values.products.findIndex(line => line.id === id);
        if (index >= 0)
          form.setError(`products.${index}.quantity`, {
            type: 'server',
            message: 'Produto não existe mais.',
          });
      }
      form.setError('root.server', {
        type: 'server',
        message: shortages.length
          ? 'Alguns itens não têm estoque suficiente. Ajuste as quantidades destacadas.'
          : 'Alguns produtos não existem mais. Remova as linhas destacadas.',
      });
    }
  }

  const productsError =
    form.formState.errors.products?.message ??
    form.formState.errors.products?.root?.message;

  return (
    <>
      <PageHeader
        title="Novo pedido"
        description="O preço de cada item é o do momento da compra."
      />
      <Form form={form} onSubmit={submit} className="gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="customer_id"
              render={({ field, fieldState }) => (
                <FieldShell
                  id="order-customer"
                  label="Cliente"
                  error={fieldState.error?.message}
                >
                  {aria => (
                    <Combobox
                      {...aria}
                      value={selectedCustomer}
                      onChange={chosen => {
                        setCustomer(chosen);
                        field.onChange(chosen.id);
                      }}
                      items={customers.data?.data}
                      isLoading={customers.isFetching}
                      onSearchChange={setCustomerTerm}
                      getKey={item => item.id}
                      getLabel={item => item.name}
                      renderItem={item => item.email}
                      placeholder="Selecione o cliente"
                      searchPlaceholder="Buscar por nome ou e-mail…"
                      emptyMessage="Nenhum cliente encontrado."
                      className="max-w-md"
                    />
                  )}
                </FieldShell>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Itens</CardTitle>
            <div className="w-full sm:max-w-sm">
              <Combobox<Product>
                aria-label="Adicionar produto"
                value={null}
                onChange={addProduct}
                items={products.data?.data}
                isLoading={products.isFetching}
                onSearchChange={setProductTerm}
                getKey={item => item.id}
                getLabel={item => item.name}
                renderItem={item =>
                  `${formatCents(item.price_cents)} · ${item.quantity === 0 ? 'esgotado' : `${item.quantity} em estoque`}`
                }
                placeholder="Adicionar produto…"
                searchPlaceholder="Buscar produto…"
                emptyMessage="Nenhum produto encontrado."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="sr-only" role="status" aria-live="polite">
              {announcement}
            </p>
            {lines.fields.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum item ainda. Use “Adicionar produto” para montar o pedido.
              </p>
            ) : (
              <ul
                className="divide-y rounded-md border"
                aria-label="Itens do pedido"
              >
                {lines.fields.map((line, index) => (
                  <OrderLine
                    key={line.key}
                    product={catalog[line.id]}
                    quantity={watched[index]?.quantity}
                    error={
                      form.formState.errors.products?.[index]?.quantity?.message
                    }
                    onQuantityChange={quantity =>
                      changeQuantity(index, quantity)
                    }
                    onRemove={() => {
                      lines.remove(index);
                      setAnnouncement(
                        `${catalog[line.id]?.name ?? 'Item'} removido do pedido.`,
                      );
                    }}
                  />
                ))}
              </ul>
            )}
            {productsError ? (
              <p role="alert" className="text-sm text-destructive">
                {productsError}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-3 border-t pt-3 text-lg">
              <span id={totalId} className="text-muted-foreground">
                Total
              </span>
              <output
                aria-labelledby={totalId}
                aria-live="polite"
                className="font-semibold tabular-nums"
              >
                {formatCents(total)}
              </output>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => void navigate({ to: '/orders' })}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {submitting ? 'Criando pedido…' : 'Criar pedido'}
          </Button>
        </div>
        {guard.dialog}
      </Form>
    </>
  );
}

interface OrderLineProps {
  product: Product | undefined;
  quantity: number | undefined;
  error: string | undefined;
  onQuantityChange: (quantity: number | undefined) => void;
  onRemove: () => void;
}

function OrderLine({
  product,
  quantity,
  error,
  onQuantityChange,
  onRemove,
}: OrderLineProps) {
  const inputId = useId();
  const messageId = useId();
  const name = product?.name ?? 'Produto';
  const price = product?.price_cents ?? 0;
  const qty = Number(quantity) || 0;
  // aviso do front com o estoque conhecido; a validação definitiva é da API
  const overStock = product !== undefined && qty > product.quantity;
  const message =
    error ??
    (overStock
      ? `Acima do estoque conhecido (${product.quantity} disponível(is)).`
      : undefined);

  return (
    <li className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_8rem_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatCents(price)} cada
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Diminuir quantidade de ${name}`}
          disabled={qty <= 1}
          onClick={() => onQuantityChange(Math.max(1, qty - 1))}
        >
          <Minus aria-hidden="true" />
        </Button>
        <label htmlFor={inputId} className="sr-only">
          Quantidade de {name}
        </label>
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className="w-20 text-center tabular-nums"
          value={
            quantity === undefined || Number.isNaN(quantity) ? '' : quantity
          }
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          onChange={event =>
            onQuantityChange(
              event.target.value === ''
                ? undefined
                : event.target.valueAsNumber,
            )
          }
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Aumentar quantidade de ${name}`}
          onClick={() => onQuantityChange(qty + 1)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
      <p className="text-right font-medium tabular-nums sm:text-right">
        <span className="sr-only">Subtotal de {name}: </span>
        {formatCents(price * qty)}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remover ${name}`}
        onClick={onRemove}
        className="justify-self-end"
      >
        <Trash2 aria-hidden="true" />
      </Button>
      {message ? (
        <p
          id={messageId}
          role={error ? 'alert' : 'status'}
          className={`flex items-center gap-1 text-sm sm:col-span-4 ${error ? 'text-destructive' : 'text-amber-700 dark:text-amber-400'}`}
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : null}
    </li>
  );
}
