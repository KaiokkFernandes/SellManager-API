import { ICustomersRepository } from '@modules/customers/domain/repositories/ICustomersRepository';
import AppError from '@shared/errors/AppError';
import { calculateOrderTotal, Order } from '../domain/entities/Order';
import { IOrdersUnitOfWork } from '../domain/repositories/IOrdersUnitOfWork';

interface IRequest {
  customer_id: string;
  products: { id: string; quantity: number }[];
}

export class CreateOrderService {
  constructor(
    private readonly customersRepository: ICustomersRepository,
    private readonly unitOfWork: IOrdersUnitOfWork,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Itens repetidos do mesmo produto viram uma linha só.
    const requested = new Map<string, number>();
    for (const { id, quantity } of products) {
      requested.set(id, (requested.get(id) ?? 0) + quantity);
    }

    return this.unitOfWork.run(
      async ({ orders, products: productsRepository }) => {
        const found = await productsRepository.findByIdsForUpdate([
          ...requested.keys(),
        ]);

        const missing = [...requested.keys()].filter(
          id => !found.some(product => product.id === id),
        );
        if (missing.length > 0) {
          throw new AppError('Products not found', 404, {
            details: { product_ids: missing },
          });
        }

        const insufficient = found
          .filter(
            product => product.quantity < (requested.get(product.id) ?? 0),
          )
          .map(product => ({
            product_id: product.id,
            available: product.quantity,
            requested: requested.get(product.id),
          }));
        if (insufficient.length > 0) {
          throw new AppError('Insufficient stock', 409, {
            code: 'INSUFFICIENT_STOCK',
            details: insufficient,
          });
        }

        // O preço vem do produto no banco, nunca do cliente.
        const items = found.map(product => ({
          product_id: product.id,
          product: { id: product.id, name: product.name },
          price: product.price,
          quantity: requested.get(product.id) ?? 0,
        }));

        for (const product of found) {
          product.quantity -= requested.get(product.id) ?? 0;
          await productsRepository.save(product);
        }

        return orders.create({
          customer_id,
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
          },
          status: 'pending',
          total: calculateOrderTotal(items),
          items,
        });
      },
    );
  }
}
