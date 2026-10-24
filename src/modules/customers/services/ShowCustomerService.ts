import AppError from "@shared/erros/AppError";
import Customer from "../typeorm/entities/Customers";
import CustomerRepository from "../typeorm/repositories/CustomersRepository";

interface IRequest {
  id: string;
}

class ShowCostumerServices {
   public async execute({id}: IRequest): Promise<Customer> {
   const customerRepository = new CustomerRepository();

   const users = await customerRepository.findById(id);

   if(!users) {
    throw new AppError('User not found');
   }
   return users;

  }
}
export default ShowCostumerServices;
