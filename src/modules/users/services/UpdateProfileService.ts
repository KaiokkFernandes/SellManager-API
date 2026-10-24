import AppError from "@shared/erros/AppError";
import Users from "../typeorm/entities/Users";;
import UserRepository from "../typeorm/repositories/UserRepository";
import { compare } from "bcryptjs";
import { hash } from "bcryptjs";

interface IRequest {
  user_id: string;
  name: string;
  email: string;
  password?: string;
  old_password?: string;
}

class UpdateProfileServices {
   public async execute({
    user_id,
    name,
    email,
    password,
    old_password
   }: IRequest): Promise<Users>{
   const usersRepository = new UserRepository();
   const users = await usersRepository.findById(user_id);

   if(!users) {
    throw new AppError('User not found');
   }

   const userUpdateEmail = await usersRepository.findByEmail(email);

    if(userUpdateEmail && userUpdateEmail.id !== user_id) {
      throw new AppError('Email already in use');
    }

    if(password && !old_password){
      throw new AppError('You need to inform the old password');
  }

  if(password && old_password){
    const checkoutPassword = await compare(old_password, users.password);
    if(!checkoutPassword){
      throw new AppError('Old password does not match');
    }
    users.password = await hash(password, 8);
  }

  users.name = name;
  users.email = email;


  await usersRepository.save(users)

   return users;

  }
}
export default UpdateProfileServices;
