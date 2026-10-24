import { beforeEach, describe, expect, it } from 'vitest';
import { Customer } from '@modules/customers/domain/entities/Customer';
import { FakeCustomersRepository } from '@modules/customers/fakes/FakeCustomersRepository';
import { Product } from '@modules/products/domain/entities/Product';
import { FakeProductsRepository } from '@modules/products/fakes/FakeProductsRepository';
import { FakeOrdersRepository } from '../fakes/FakeOrdersRepository';
import { FakeOrdersUnitOfWork } from '../fakes/FakeOrdersUnitOfWork';
import { CreateOrderService } from './CreateOrderService';
import { ListOrdersService } from './ListOrdersService';
import { ShowOrderService } from './ShowOrderService';
import { UpdateOrderStatusService } from './UpdateOrderStatusService';

describe('Order services', () => {
  let customers: FakeCustomersRepository;
  let products: FakeProductsRepository;
  let orders: FakeOrdersRepository;
  let createOrder: CreateOrderService;
  let updateStatus: UpdateOrderStatusService;
  let customer: Customer;
  let keyboard: Product;
  let mouse: Product;

  const stockOf = async (product: Product) =>
    (await products.findById(product.id))?.quantity;

  beforeEach(async () => {
    customers = new FakeCustomersRepository();
    products = new FakeProductsRepository();
    orders = new FakeOrdersRepository();
    const unitOfWork = new FakeOrdersUnitOfWork(orders, products);
    createOrder = new CreateOrderService(customers, unitOfWork);
    updateStatus = new UpdateOrderStatusService(unitOfWork);

    customer = await customers.create({ name: 'Ana', email: 'ana@test.com' });
    keyboard = await products.create({
      name: 'Teclado',
      price: 199.9,
      quantity: 10,
    });
    mouse = await products.create({ name: 'Mouse', price: 49.95, quantity: 1 });
  });

  describe('CreateOrderService', () => {
    it('cria o pedido copiando o preço do produto e calculando o total', async () => {
      const order = await createOrder.execute({
        customer_id: customer.id,
        products: [
          { id: keyboard.id, quantity: 2 },
          { id: mouse.id, quantity: 1 },
        ],
      });

      expect(order.status).toBe('pending');
      expect(order.total).toBe(449.75);
      expect(order.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            product_id: keyboard.id,
            price: 199.9,
            quantity: 2,
          }),
          expect.objectContaining({
            product_id: mouse.id,
            price: 49.95,
            quantity: 1,
          }),
        ]),
      );
    });

    it('baixa o estoque dos produtos', async () => {
      await createOrder.execute({
        customer_id: customer.id,
        products: [{ id: keyboard.id, quantity: 3 }],
      });

      expect(await stockOf(keyboard)).toBe(7);
    });

    it('soma itens repetidos do mesmo produto', async () => {
      const order = await createOrder.execute({
        customer_id: customer.id,
        products: [
          { id: keyboard.id, quantity: 1 },
          { id: keyboard.id, quantity: 2 },
        ],
      });

      expect(order.items).toHaveLength(1);
      expect(order.items[0]?.quantity).toBe(3);
    });

    it('rejeita estoque insuficiente sem alterar nada (atomicidade)', async () => {
      await expect(
        createOrder.execute({
          customer_id: customer.id,
          products: [
            { id: keyboard.id, quantity: 1 },
            { id: mouse.id, quantity: 2 },
          ],
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Insufficient stock',
      });

      expect(await stockOf(keyboard)).toBe(10);
      expect(await stockOf(mouse)).toBe(1);
      expect(orders.orders).toHaveLength(0);
    });

    it('rejeita cliente inexistente', async () => {
      await expect(
        createOrder.execute({
          customer_id: 'nope',
          products: [{ id: keyboard.id, quantity: 1 }],
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Customer not found',
      });
    });

    it('rejeita produtos inexistentes informando quais', async () => {
      await expect(
        createOrder.execute({
          customer_id: customer.id,
          products: [{ id: 'nope', quantity: 1 }],
        }),
      ).rejects.toMatchObject({
        statusCode: 404,
        details: { product_ids: ['nope'] },
      });
    });
  });

  describe('List / Show', () => {
    it('lista filtrando por cliente e mostra um pedido', async () => {
      const other = await customers.create({
        name: 'Bia',
        email: 'bia@test.com',
      });
      const order = await createOrder.execute({
        customer_id: customer.id,
        products: [{ id: keyboard.id, quantity: 1 }],
      });
      await createOrder.execute({
        customer_id: other.id,
        products: [{ id: keyboard.id, quantity: 1 }],
      });

      const list = await new ListOrdersService(orders).execute({
        customer_id: customer.id,
      });
      expect(list.map(item => item.id)).toEqual([order.id]);

      const shown = await new ShowOrderService(orders).execute({
        id: order.id,
      });
      expect(shown.items).toHaveLength(1);
      await expect(
        new ShowOrderService(orders).execute({ id: 'nope' }),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('UpdateOrderStatusService', () => {
    it('cancelar devolve o estoque', async () => {
      const order = await createOrder.execute({
        customer_id: customer.id,
        products: [{ id: keyboard.id, quantity: 4 }],
      });

      const canceled = await updateStatus.execute({
        id: order.id,
        status: 'canceled',
      });

      expect(canceled.status).toBe('canceled');
      expect(await stockOf(keyboard)).toBe(10);
    });

    it('concluir não mexe no estoque e impede cancelar depois', async () => {
      const order = await createOrder.execute({
        customer_id: customer.id,
        products: [{ id: keyboard.id, quantity: 4 }],
      });

      await updateStatus.execute({ id: order.id, status: 'completed' });

      expect(await stockOf(keyboard)).toBe(6);
      await expect(
        updateStatus.execute({ id: order.id, status: 'canceled' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('responde 404 para pedido inexistente', async () => {
      await expect(
        updateStatus.execute({ id: 'nope', status: 'completed' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
