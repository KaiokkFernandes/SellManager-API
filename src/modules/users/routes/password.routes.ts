import { Router } from 'express';
import { validate } from '@shared/http/middlewares/validate';
import {
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
} from './users.schemas';
import ForgotPasswordController from '../controllers/FotgotPasswordController';
import ResetPasswordController from '../controllers/ResetPasswordController';

const passwordRoutes = Router();
const forgotPasswordController = new ForgotPasswordController();
const resetPasswordController = new ResetPasswordController();

passwordRoutes.post(
  '/forgot',
  validate({ body: forgotPasswordBodySchema }),
  forgotPasswordController.create.bind(forgotPasswordController),
);

passwordRoutes.post(
  '/reset',
  validate({ body: resetPasswordBodySchema }),
  resetPasswordController.create.bind(resetPasswordController),
);

export default passwordRoutes;
