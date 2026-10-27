import AppError from '@shared/errors/AppError';
import { IStorageProvider } from '@shared/providers/StorageProvider/IStorageProvider';
import { Product } from '../domain/entities/Product';
import { IProductsRepository } from '../domain/repositories/IProductsRepository';

interface IRequest {
  id: string;
  /** Arquivo já recebido na pasta temporária, ou null para remover a imagem. */
  imageFileName: string | null;
}

/** Envia, substitui ou remove a imagem; o arquivo anterior é apagado. */
export class UpdateProductImageService {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  public async execute({ id, imageFileName }: IRequest): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      if (imageFileName) await this.storageProvider.discardFile(imageFileName);
      throw new AppError('Product not found', 404);
    }

    if (product.image) {
      await this.storageProvider.deleteFile(product.image);
    }
    product.image = imageFileName
      ? await this.storageProvider.saveFile(imageFileName)
      : null;

    return this.productsRepository.save(product);
  }
}
