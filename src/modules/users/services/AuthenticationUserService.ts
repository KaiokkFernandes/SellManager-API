import AppError from '@shared/erros/AppError';
import Users from '../typeorm/entities/Users';
import UserRepository from '../typeorm/repositories/UserRepository';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import authConfig from '../../../config/auth';

interface IRequest {
  email: string;
  password: string;
}
interface IResponse {
  user: Users;
  token: string;
}

class AuthenticationUserService {
  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const usersRepository = new UserRepository();

    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const matchPassword = await compare(password, user.password);

    if (!matchPassword) {
      throw new AppError('Incorret password, please try again.', 401);
    }

    const token = await new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(authConfig.jwt.expiresIn)
      .sign(new TextEncoder().encode(authConfig.jwt.secret));

    return {
      user,
      token,
    };
  }
}

export default AuthenticationUserService;
