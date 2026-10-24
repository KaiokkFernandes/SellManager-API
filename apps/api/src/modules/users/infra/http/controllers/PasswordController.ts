import { Request, Response } from 'express';
import { ResetPasswordService } from '../../../services/ResetPasswordService';
import { SendForgotPasswordEmailService } from '../../../services/SendForgotPasswordEmailService';
import { ForgotPasswordBody, ResetPasswordBody } from '../schemas';

export class PasswordController {
  constructor(
    private readonly sendForgotPasswordEmail: SendForgotPasswordEmailService,
    private readonly resetPassword: ResetPasswordService,
  ) {}

  public forgot = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.sendForgotPasswordEmail.execute(
      request.body as ForgotPasswordBody,
    );
    response.status(204).send();
  };

  public reset = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const { token, password } = request.body as ResetPasswordBody;
    await this.resetPassword.execute({ token, password });
    response.status(204).send();
  };
}
