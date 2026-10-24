import { Request, Response } from 'express';
import { ForgotPasswordBody } from '../routes/users.schemas';
import SendForgotPasswordEmailService from '../services/SendForgotPasswordEmailService';

export default class ForgotPasswordController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email } = request.body as ForgotPasswordBody;

    const sendForgotPasswordEmail = new SendForgotPasswordEmailService();

    await sendForgotPasswordEmail.execute({
      email,
    });

    return response
      .status(204)
      .json({ message: 'Email de recuperação enviado com sucesso!' });
  }
}
