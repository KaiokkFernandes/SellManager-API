import Customer from "../typeorm/entities/Customers";
import CustomerRepository from "../typeorm/repositories/CustomersRepository";


class ListCostumerServices {
   public async execute(): Promise<Customer[]>{
   const usersRepository = new CustomerRepository();

   const customers = await usersRepository.findAll();

   return  customers;

  }
}
export default ListCostumerServices;
