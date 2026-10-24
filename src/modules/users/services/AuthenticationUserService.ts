import AppError from "@shared/erros/AppError";
import { getCustomRepository } from "typeorm";
import Users from "../typeorm/entities/Users";
import UserRepository from "../typeorm/repositories/UserRepository";
import { compare } from "bcryptjs";
const jwt = require('jsonwebtoken');
import authConfig from '../../../config/auth';


interface IRequest{
  email: string;
  password: string;
}
interface IResponse {
  user: Users;
  token: string;
}


class AuthenticationUserService {
  public async execute({ email, password, }: IRequest): Promise<IResponse>{
    const usersRepository = getCustomRepository(UserRepository);

    const user = await usersRepository.findByEmail(email);
    if(!user){
     throw new AppError('Incorrect email/password combination.', 401);
    }

   const matchPassword = await compare(password, user.password);

   if(!matchPassword){
    throw new AppError("Incorret password, please try again.", 401);
   }


   const token = jwt.sign(
    { id: user.id, email: user.email },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.expiresIn }
  );

     return {
        user,
        token
     };
  }

}

export default  AuthenticationUserService;
