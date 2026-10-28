import type { routes } from '@sellmanager/shared';
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
import { ListStockMovementsService } from '../../../services/ListStockMovementsService';
import { RecordStockMovementService } from '../../../services/RecordStockMovementService';
import { toProductResponse, toStockMovementResponse } from '../ProductMapper';

interface ProductsServices {
  list: ListProductsService;
  show: ShowProductService;
  create: CreateProductService;
  update: UpdateProductService;
  delete: DeleteProductService;
  updateImage: UpdateProductImageService;
  listStockMovements: ListStockMovementsService;
  recordStockMovement: RecordStockMovementService;
}

type Routes = typeof routes.products;

export class ProductsController {
  constructor(
    private readonly services: ProductsServices,
    private readonly apiUrl: string,
  ) {}

  private toResponse = (product: Product) =>
    toProductResponse(product, this.apiUrl);

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { page, limit, q, category_id, sort, order } = input.query;
    const { data, meta } = await this.services.list.execute(
      { search: q, category_id, sort, order },
      { page, limit },
    );
    reply(200, { data: data.map(this.toResponse), meta });
  };

  public show: RouteHandler<Routes['show']> = async ({ input, reply }) => {
    const product = await this.services.show.execute({ id: input.params.id });
    reply(200, this.toResponse(product));
  };

  public create: RouteHandler<Routes['create']> = async ({
    input,
    request,
    reply,
  }) => {
    const { name, price_cents, quantity, category_id } = input.body;
    // contrato em centavos -> domínio em decimal
    const product = await this.services.create.execute({
      name,
      price: fromCents(price_cents),
      quantity,
      category_id,
      created_by: request.user.id,
    });
    reply(201, this.toResponse(product));
  };

  public update: RouteHandler<Routes['update']> = async ({ input, reply }) => {
    const product = await this.services.update.execute({
      id: input.params.id,
      name: input.body.name,
      price: fromCents(input.body.price_cents),
      category_id: input.body.category_id,
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

  public listStockMovements: RouteHandler<Routes['listStockMovements']> =
    async ({ input, reply }) => {
      const { data, meta } = await this.services.listStockMovements.execute(
        { product_id: input.params.id },
        input.query,
      );
      reply(200, { data: data.map(toStockMovementResponse), meta });
    };

  public createStockMovement: RouteHandler<Routes['createStockMovement']> =
    async ({ input, request, reply }) => {
      const movement = await this.services.recordStockMovement.execute({
        product_id: input.params.id,
        ...input.body,
        created_by: request.user.id,
      });
      reply(201, toStockMovementResponse(movement));
    };
}
