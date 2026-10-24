import ProductRepository from "../typeorm/repositories/ProductRepository";
import AppError from "@shared/erros/AppError";


interface IProduct{
  id: string;
  name: string;
  price: number;
  quantity: number;
}

class UpdateProductService{
  public async execute({id, name, price, quantity}: IProduct): Promise<IProduct>{
   const productRepository = new ProductRepository();

   const product = await productRepository.findById(id);

   if(!product){
     throw new AppError("Product not found");
   }
   const productExists = await productRepository.findByName(name);

   if (productExists && name !== product.name){
     throw new AppError('There is already one product with this name');
   }

   product.name = name;
   product.price = price;
   product.quantity = quantity;

   await productRepository.save(product);
   return product;
  }
}

export default UpdateProductService;
