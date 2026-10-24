import AppError from "@shared/erros/AppError";
import CustomerRepository from "../typeorm/repositories/CustomersRepository";


interface IRequest {
  id: string;
}

class DeleteCostumerService {
  public async execute({id}: IRequest): Promise<void>{
    const costumerRepostory = new CustomerRepository();

    const costumer = await costumerRepostory.findById(id);

    if(!costumer){
      throw new AppError("Customer not found", 404);
    }

    await costumerRepostory.remove(costumer);
  }
}

export default DeleteCostumerService;
