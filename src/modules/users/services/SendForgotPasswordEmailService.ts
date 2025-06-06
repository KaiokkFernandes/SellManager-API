import AppError from "@shared/erros/AppError";
import { getCustomRepository } from "typeorm";
import UserRepository from "../typeorm/repositories/UserRepository";
import UserTokenRepository from "../typeorm/repositories/UserTokenRepository";
import EtherealMail from "@config/mail/EtherealMail";
import path from 'path';
import { link } from "joi";

interface IRequest{
    email: string;
}

class SendForgotPasswordEmailService{
   public async execute({ email}: IRequest): Promise<void>{
     const usersRepository = getCustomRepository(UserRepository);
     const userTokenRepository = getCustomRepository(UserTokenRepository);

     const user = await usersRepository.findByEmail(email);

     if(!user){
        throw new AppError('User does not exists');
     }


     const token =  await userTokenRepository.generate(user.id);

     const forgotPasswordTemplate = path.resolve(__dirname, '..', 'views', 'forgot_password.hbs');

     await EtherealMail.sendMail({
        to: {
            name: user.name,
            email: user.email,
        },
        subject: '[API Vendas] Recuperação de senha',
        templateData:{
            file: forgotPasswordTemplate,
            variables:{
              name: user.name,
              link: `http:/localhost:3000/reset_password?token=${token.token}`,
            }
        }
     })
   }

}


export default SendForgotPasswordEmailService;
