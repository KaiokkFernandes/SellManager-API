import { Product } from '../entities/Product';

export interface ICreateProductDTO {
  name: string;
  price: number;
  quantity: number;
}

export interface IProductsRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  create(data: ICreateProductDTO): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(product: Product): Promise<void>;
}
