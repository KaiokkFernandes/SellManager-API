import { Request, Response } from 'express';
import { ResetPasswordBody } from '../routes/users.schemas';
import ResetPasswordService from '../services/ResetPasswordService';

export default class ResetPasswordController {
  public async create(request: Request, response: Response): Promise<void> {
    const { password, token } = request.body as ResetPasswordBody;

    const resetPassword = new ResetPasswordService();

    await resetPassword.execute({
      password,
      token,
    });

    response.status(204).send();
  }
}
