import type { StockMovement } from '@sellmanager/api-client';
import {
  stockMovementBodySchema,
  type StockMovementType,
} from '@sellmanager/shared';
import { Link } from '@tanstack/react-router';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable, type Column } from '@/components/data-table';
import {
  applyApiError,
  Form,
  NumberField,
  SelectField,
  TextareaField,
  useZodForm,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { usePermission } from '@/features/auth';
import { useRecordStockMovement, useStockMovements } from './queries';

const TYPE_LABELS: Record<StockMovementType, string> = {
  INITIAL: 'Saldo inicial',
  ENTRY: 'Entrada',
  SALE: 'Venda',
  CANCEL_RETURN: 'Devolução (cancelamento)',
  ADJUSTMENT: 'Ajuste manual',
};

function signed(quantity: number): string {
  return quantity > 0 ? `+${quantity}` : String(quantity);
}

const columns: Column<StockMovement>[] = [
  {
    id: 'date',
    header: 'Data',
    cell: movement => formatDateTime(movement.created_at),
  },
  { id: 'type', header: 'Tipo', cell: movement => TYPE_LABELS[movement.type] },
  {
    id: 'quantity',
    header: 'Quantidade',
    className: 'text-right tabular-nums',
    cell: movement => signed(movement.quantity),
  },
  {
    id: 'balance',
    header: 'Saldo após',
    className: 'text-right tabular-nums',
    cell: movement => movement.balance_after,
  },
  {
    id: 'detail',
    header: 'Motivo / pedido',
    cell: movement =>
      movement.order_id ? (
        <Link
          to="/orders/$orderId"
          params={{ orderId: movement.order_id }}
          className="hover:underline"
        >
          Pedido nº {movement.order_id.slice(0, 8)}
        </Link>
      ) : (
        (movement.reason ?? '—')
      ),
  },
  {
    id: 'by',
    header: 'Por',
    cell: movement => movement.created_by?.name ?? '—',
  },
];

/** Aba "Movimentações": o livro de estoque do produto e o ajuste manual. */
export function StockMovementsPanel({
  productId,
  page,
  onPageChange,
}: {
  productId: string;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const movements = useStockMovements(productId, page);
  const canAdjust = usePermission('stock:adjust');
  const [adjusting, setAdjusting] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          O estoque só muda por estas movimentações; o saldo é a soma delas.
        </p>
        {canAdjust ? (
          <Button variant="outline" onClick={() => setAdjusting(true)}>
            <SlidersHorizontal aria-hidden="true" />
            Ajustar estoque
          </Button>
        ) : null}
      </div>
      <DataTable
        caption="Movimentações de estoque"
        columns={columns}
        data={movements.data?.data}
        meta={movements.data?.meta}
        getRowId={movement => movement.id}
        isLoading={movements.isPending}
        error={movements.error}
        onRetry={() => void movements.refetch()}
        onPageChange={onPageChange}
        emptyMessage="Nenhuma movimentação ainda."
        renderCard={movement => (
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-2 font-medium">
              <span>{TYPE_LABELS[movement.type]}</span>
              <span className="tabular-nums">
                {signed(movement.quantity)} → {movement.balance_after}
              </span>
            </p>
            <p className="text-muted-foreground">
              {formatDateTime(movement.created_at)}
              {movement.created_by ? ` · ${movement.created_by.name}` : ''}
              {movement.reason ? ` · ${movement.reason}` : ''}
            </p>
          </div>
        )}
      />
      {adjusting ? (
        <StockMovementDialog
          productId={productId}
          onClose={() => setAdjusting(false)}
        />
      ) : null}
    </div>
  );
}

const TYPE_OPTIONS = [
  { value: 'ENTRY', label: 'Entrada de mercadoria' },
  { value: 'ADJUSTMENT', label: 'Ajuste manual (±)' },
] as const;

function StockMovementDialog({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const record = useRecordStockMovement(productId);
  // MESMO schema da API: motivo obrigatório no ajuste, entrada positiva
  const form = useZodForm(stockMovementBodySchema, {
    defaultValues: { type: 'ENTRY', reason: '' },
  });
  const type = form.watch('type');
  const submit = form.handleSubmit(async body => {
    try {
      await record.mutateAsync(body);
      onClose();
    } catch (error) {
      applyApiError(form, error);
    }
  });

  return (
    <ConfirmDialog
      open
      onOpenChange={open => !open && onClose()}
      title="Ajustar estoque"
      description="A movimentação fica registrada com o seu nome e não pode ser desfeita (registre outra para corrigir)."
      confirmLabel="Registrar"
      isPending={record.isPending}
      onConfirm={() => void submit()}
    >
      <Form form={form} onSubmit={() => void submit()}>
        <SelectField
          control={form.control}
          name="type"
          label="Tipo"
          options={TYPE_OPTIONS}
        />
        <NumberField
          control={form.control}
          name="quantity"
          label="Quantidade"
          step={1}
          inputMode="numeric"
          description={
            type === 'ADJUSTMENT'
              ? 'Negativa para retirar (ex.: -2), positiva para somar'
              : 'Unidades que chegaram'
          }
        />
        <TextareaField
          control={form.control}
          name="reason"
          label={type === 'ADJUSTMENT' ? 'Motivo' : 'Observação (opcional)'}
          rows={2}
          maxLength={500}
        />
      </Form>
    </ConfirmDialog>
  );
}
