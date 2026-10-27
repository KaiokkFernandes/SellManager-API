import type { IOrdersRepository } from '@modules/orders/domain/repositories/IOrdersRepository';
import AppError from '@shared/errors/AppError';
import { IStorageProvider } from '@shared/providers/StorageProvider/IStorageProvider';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

export class DeleteProductService {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly ordersRepository: Pick<
      IOrdersRepository,
      'countByProduct'
    >,
    private readonly storageProvider: IStorageProvider,
  ) {}

  public async execute({ id }: { id: string }): Promise<void> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // os itens de pedido guardam o produto: ele não pode sumir do histórico
    // (a FK RESTRICT no banco é a rede de segurança)
    const ordersCount = await this.ordersRepository.countByProduct(id);
    if (ordersCount > 0) {
      throw new AppError('Product is in orders and cannot be deleted', 409, {
        code: 'RESOURCE_IN_USE',
        details: { orders_count: ordersCount },
      });
    }

    await this.productsRepository.remove(product);
    if (product.image) await this.storageProvider.deleteFile(product.image);
  }
}
