import type { ProductBody, routes } from '@sellmanager/shared';
import AppError from '@shared/errors/AppError';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { fromCents } from '@shared/http/money';
import { Product } from '../../../domain/entities/Product';
import { CreateProductService } from '../../../services/CreateProductService';
import { DeleteProductService } from '../../../services/DeleteProductService';
import { ListProductsService } from '../../../services/ListProductsService';
import { ShowProductService } from '../../../services/ShowProductService';
import { UpdateProductImageService } from '../../../services/UpdateProductImageService';
import { UpdateProductService } from '../../../services/UpdateProductService';
import { toProductResponse } from '../ProductMapper';

interface ProductsServices {
  list: ListProductsService;
  show: ShowProductService;
  create: CreateProductService;
  update: UpdateProductService;
  delete: DeleteProductService;
  updateImage: UpdateProductImageService;
}

type Routes = typeof routes.products;

// contrato em centavos -> domínio em decimal
function toProductInput({ name, price_cents, quantity }: ProductBody) {
  return { name, price: fromCents(price_cents), quantity };
}

export class ProductsController {
  constructor(
    private readonly services: ProductsServices,
    private readonly apiUrl: string,
  ) {}

  private toResponse = (product: Product) =>
    toProductResponse(product, this.apiUrl);

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { page, limit, q, sort, order } = input.query;
    const { data, meta } = await this.services.list.execute(
      { search: q, sort, order },
      { page, limit },
    );
    reply(200, { data: data.map(this.toResponse), meta });
  };

  public show: RouteHandler<Routes['show']> = async ({ input, reply }) => {
    const product = await this.services.show.execute({ id: input.params.id });
    reply(200, this.toResponse(product));
  };

  public create: RouteHandler<Routes['create']> = async ({ input, reply }) => {
    const product = await this.services.create.execute(
      toProductInput(input.body),
    );
    reply(201, this.toResponse(product));
  };

  public update: RouteHandler<Routes['update']> = async ({ input, reply }) => {
    const product = await this.services.update.execute({
      id: input.params.id,
      ...toProductInput(input.body),
    });
    reply(200, this.toResponse(product));
  };

  public delete: RouteHandler<Routes['delete']> = async ({ input, reply }) => {
    await this.services.delete.execute({ id: input.params.id });
    reply(204);
  };

  public updateImage: RouteHandler<Routes['updateImage']> = async ({
    input,
    request,
    reply,
  }) => {
    if (!request.file) {
      throw new AppError('Image file is required', 400, {
        code: 'INVALID_UPLOAD',
      });
    }
    const product = await this.services.updateImage.execute({
      id: input.params.id,
      imageFileName: request.file.filename,
    });
    reply(200, this.toResponse(product));
  };

  public deleteImage: RouteHandler<Routes['deleteImage']> = async ({
    input,
    reply,
  }) => {
    const product = await this.services.updateImage.execute({
      id: input.params.id,
      imageFileName: null,
    });
    reply(200, this.toResponse(product));
  };
}
