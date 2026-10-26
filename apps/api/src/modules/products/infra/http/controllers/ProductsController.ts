import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { CreateProductService } from '../../../services/CreateProductService';
import { DeleteProductService } from '../../../services/DeleteProductService';
import { ListProductsService } from '../../../services/ListProductsService';
import { ShowProductService } from '../../../services/ShowProductService';
import { UpdateProductService } from '../../../services/UpdateProductService';
import { toProductResponse } from '../ProductMapper';

interface ProductsServices {
  list: ListProductsService;
  show: ShowProductService;
  create: CreateProductService;
  update: UpdateProductService;
  delete: DeleteProductService;
}

type Routes = typeof routes.products;

export class ProductsController {
  constructor(private readonly services: ProductsServices) {}

  public list: RouteHandler<Routes['list']> = async ({ input, reply }) => {
    const { data, meta } = await this.services.list.execute(input.query);
    reply(200, { data: data.map(toProductResponse), meta });
  };

  public show: RouteHandler<Routes['show']> = async ({ input, reply }) => {
    const product = await this.services.show.execute({ id: input.params.id });
    reply(200, toProductResponse(product));
  };

  public create: RouteHandler<Routes['create']> = async ({ input, reply }) => {
    const product = await this.services.create.execute(input.body);
    reply(201, toProductResponse(product));
  };

  public update: RouteHandler<Routes['update']> = async ({ input, reply }) => {
    const product = await this.services.update.execute({
      id: input.params.id,
      ...input.body,
    });
    reply(200, toProductResponse(product));
  };

  public delete: RouteHandler<Routes['delete']> = async ({ input, reply }) => {
    await this.services.delete.execute({ id: input.params.id });
    reply(204);
  };
}
