import AppError from "@shared/erros/AppError";
import Customer from "../typeorm/entities/Customers";
import CustomerRepository from "../typeorm/repositories/CustomersRepository";

interface IRequest {
  id: string;
  name: string;
  email: string;
  password?: string;
  old_password?: string;
}

class UpdateCustomerServices {
   public async execute({
    id,
    name,
    email,
   }: IRequest): Promise<Customer>{
   const customerRepository = new CustomerRepository();
   const customer = await customerRepository.findById(id);

   if(!customer) {
    throw new AppError('Customer not found', 404);
   }

   const customerExist = await customerRepository.findByEmail(email);

    if(customerExist && customerExist.id !== id) {
      throw new AppError('Email already in use');
    }

  customer.name = name;
  customer.email = email;


  await customerRepository.save(customer)

   return customer;

  }
}
export default UpdateCustomerServices;
