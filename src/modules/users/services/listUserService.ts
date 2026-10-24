import Users from "../typeorm/entities/Users";
import UserRepository from "../typeorm/repositories/UserRepository";


class ListUsersServices {
   public async execute(): Promise<Users[]>{
   const usersRepository = new UserRepository();

   const users = await usersRepository.findAll();

   return users;

  }
}
export default ListUsersServices;
