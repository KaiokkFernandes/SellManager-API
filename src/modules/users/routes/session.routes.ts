import { Router } from 'express';
import asyncHandler from '@config/Middleware';
import { validate } from '@shared/http/middlewares/validate';
import { sessionBodySchema } from './users.schemas';
import AuthenticationSessionController from '../controllers/AuthenticationSessionController';

const sessionsRouter = Router();
const sessionsController = new AuthenticationSessionController();

// rota para criar uma sessão
sessionsRouter.post(
  '/',
  validate({ body: sessionBodySchema }),
  asyncHandler(sessionsController.create.bind(sessionsController)),
);

export default sessionsRouter;
