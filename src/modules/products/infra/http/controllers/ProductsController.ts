import { Request, Response } from 'express';
import { CreateProductService } from '../../../services/CreateProductService';
import { DeleteProductService } from '../../../services/DeleteProductService';
import { ListProductsService } from '../../../services/ListProductsService';
import { ShowProductService } from '../../../services/ShowProductService';
import { UpdateProductService } from '../../../services/UpdateProductService';
import { ProductBody } from '../schemas';

interface ProductsServices {
  list: ListProductsService;
  show: ShowProductService;
  create: CreateProductService;
  update: UpdateProductService;
  delete: DeleteProductService;
}

export class ProductsController {
  constructor(private readonly services: ProductsServices) {}

  public index = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    response.json(await this.services.list.execute());
  };

  public show = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    response.json(await this.services.show.execute({ id: request.params.id }));
  };

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const product = await this.services.create.execute(
      request.body as ProductBody,
    );
    response.status(201).json(product);
  };

  public update = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    const product = await this.services.update.execute({
      id: request.params.id,
      ...(request.body as ProductBody),
    });
    response.json(product);
  };

  public delete = async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    await this.services.delete.execute({ id: request.params.id });
    response.status(204).send();
  };
}
