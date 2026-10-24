import { Request, Response } from 'express';
import { ForgotPasswordBody } from '../routes/users.schemas';
import SendForgotPasswordEmailService from '../services/SendForgotPasswordEmailService';

export default class ForgotPasswordController {
  public async create(request: Request, response: Response): Promise<void> {
    const { email } = request.body as ForgotPasswordBody;

    const sendForgotPasswordEmail = new SendForgotPasswordEmailService();

    await sendForgotPasswordEmail.execute({
      email,
    });

    response.status(204).send();
  }
}
