import { getCustomRepository } from "typeorm";
import ProductRepository from "../typeorm/repositories/ProductRepository";
import Product from "../typeorm/entities/Product";
import AppError from "@shared/erros/AppError";


interface IProduct{
  id: string;
}


class ShowProductService{
   public async execute({id}: IProduct): Promise<Product>{
     const productRepository = getCustomRepository(ProductRepository);

     const product = await productRepository.findOne(id);

     if(!product){
        throw new AppError("Product not found");
     }
     return product;
   }
}
export default ShowProductService;
