import AppError from '@shared/errors/AppError';
import {
  IFileToStore,
  IStorageProvider,
} from '@shared/providers/StorageProvider/IStorageProvider';
import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

interface IRequest {
  id: string;
  /** Arquivo recebido, ou null para remover a imagem. */
  image: IFileToStore | null;
}

/**
 * Envia, substitui ou remove a imagem. A anterior só é apagada depois que o
 * banco aponta para a nova: uma falha no meio nunca deixa o produto apontando
 * para um arquivo que não existe mais.
 */
export class UpdateProductImageService {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  public async execute({ id, image }: IRequest): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const previous = product.image;
    const url = image ? await this.storageProvider.save(image) : null;
    product.image = url;

    let saved: Product;
    try {
      saved = await this.productsRepository.save(product);
    } catch (error) {
      if (url) await this.storageProvider.delete(url);
      throw error;
    }

    if (previous) await this.storageProvider.delete(previous);
    return saved;
  }
}
