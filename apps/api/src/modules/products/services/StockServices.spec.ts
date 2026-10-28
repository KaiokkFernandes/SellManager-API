import { beforeEach, describe, expect, it } from 'vitest';
import { Product } from '../domain/entities/Product';
import { StockLedger } from '../domain/StockLedger';
import { FakeProductsRepository } from '../fakes/FakeProductsRepository';
import { FakeProductsUnitOfWork } from '../fakes/FakeProductsUnitOfWork';
import { FakeStockMovementsRepository } from '../fakes/FakeStockMovementsRepository';
import { ListStockMovementsService } from './ListStockMovementsService';
import { RecordStockMovementService } from './RecordStockMovementService';

const ACTOR = 'manager-1';

describe('estoque', () => {
  let products: FakeProductsRepository;
  let movements: FakeStockMovementsRepository;
  let record: RecordStockMovementService;
  let cable: Product;

  const stock = async () => (await products.findById(cable.id))?.quantity;

  beforeEach(async () => {
    products = new FakeProductsRepository();
    movements = new FakeStockMovementsRepository();
    record = new RecordStockMovementService(
      new FakeProductsUnitOfWork(products, movements),
    );
    cable = await products.create({ name: 'Cabo', price: 10, quantity: 0 });
    await new StockLedger(products, movements).move(cable, {
      type: 'INITIAL',
      quantity: 5,
      created_by: ACTOR,
    });
  });

  describe('StockLedger', () => {
    const ledger = () => new StockLedger(products, movements);

    it.each([
      ['INITIAL', -1],
      ['ENTRY', -3],
      ['SALE', 2],
      ['CANCEL_RETURN', -2],
      ['ADJUSTMENT', 0],
      ['ENTRY', 1.5],
    ] as const)(
      '%s com quantidade %d é inválido (400)',
      async (type, quantity) => {
        await expect(
          ledger().move(cable, {
            type,
            quantity,
            reason: 'motivo',
            order_id: 'o1',
            created_by: ACTOR,
          }),
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(await stock()).toBe(5);
      },
    );

    it('ajuste exige motivo; venda e devolução exigem o pedido', async () => {
      await expect(
        ledger().move(cable, {
          type: 'ADJUSTMENT',
          quantity: -1,
          created_by: ACTOR,
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
      await expect(
        ledger().move(cable, { type: 'SALE', quantity: -1, created_by: ACTOR }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('nunca deixa o saldo negativo (409 INSUFFICIENT_STOCK)', async () => {
      await expect(
        ledger().move(cable, {
          type: 'SALE',
          quantity: -6,
          order_id: 'o1',
          created_by: ACTOR,
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'INSUFFICIENT_STOCK',
        details: [{ product_id: cable.id, available: 5, requested: 6 }],
      });
    });

    it('grava a movimentação com o saldo após e mantém saldo = soma', async () => {
      const sale = await ledger().move(cable, {
        type: 'SALE',
        quantity: -2,
        order_id: 'o1',
        created_by: ACTOR,
      });

      expect(sale).toMatchObject({ balance_after: 3, order_id: 'o1' });
      expect(await stock()).toBe(3);
      expect(movements.sumFor(cable.id)).toBe(3);
    });
  });

  describe('RecordStockMovementService', () => {
    it('registra entrada e ajuste negativo com motivo', async () => {
      await record.execute({
        product_id: cable.id,
        type: 'ENTRY',
        quantity: 10,
        created_by: ACTOR,
      });
      const adjustment = await record.execute({
        product_id: cable.id,
        type: 'ADJUSTMENT',
        quantity: -4,
        reason: '  Avaria  ',
        created_by: ACTOR,
      });

      expect(adjustment).toMatchObject({
        type: 'ADJUSTMENT',
        quantity: -4,
        balance_after: 11,
        reason: 'Avaria',
      });
      expect(await stock()).toBe(11);
      expect(movements.sumFor(cable.id)).toBe(11);
    });

    it('ajuste que zera além do saldo: 409 e nada muda', async () => {
      await expect(
        record.execute({
          product_id: cable.id,
          type: 'ADJUSTMENT',
          quantity: -6,
          reason: 'Inventário',
          created_by: ACTOR,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(await stock()).toBe(5);
      expect(movements.movements).toHaveLength(1);
    });

    it('404 para produto inexistente', async () => {
      await expect(
        record.execute({
          product_id: 'nope',
          type: 'ENTRY',
          quantity: 1,
          created_by: ACTOR,
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  it('lista as movimentações mais recentes primeiro', async () => {
    await record.execute({
      product_id: cable.id,
      type: 'ENTRY',
      quantity: 2,
      created_by: ACTOR,
    });
    const list = new ListStockMovementsService(products, movements);

    const { data, meta } = await list.execute({ product_id: cable.id });
    expect(data.map(movement => movement.type)).toEqual(['ENTRY', 'INITIAL']);
    expect(meta.total).toBe(2);
    await expect(list.execute({ product_id: 'nope' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
