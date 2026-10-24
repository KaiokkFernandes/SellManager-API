import { getCustomRepository } from "typeorm";
import Customer from "../typeorm/entities/Customers";
import CustomerRepository from "../typeorm/repositories/CustomersRepository";


class ListCostumerServices {
   public async execute(): Promise<Customer[]>{
   const usersRepository = getCustomRepository(CustomerRepository);

   const customers = await usersRepository.find();

   return  customers;

  }
}
export default ListCostumerServices;
