import {Request, Response} from 'express';
import { toUserResponse } from "../mappers/UserMapper";
import AuthenticationUserService from '../services/AuthenticationUserService';


export default class AuthenticationSessionController {
   public async create(request: Request, response : Response): Promise<Response>{
      const {email, password} = request.body;

     const createSession = new AuthenticationUserService();

     const { user, token } = await createSession.execute({
      email,
      password
     })

     return response.json({ user: toUserResponse(user), token });
   }
}
