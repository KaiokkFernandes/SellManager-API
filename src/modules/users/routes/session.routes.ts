import { Router } from 'express';
import asyncHandler from '@config/Middleware';
import { celebrate, Joi, Segments } from 'celebrate';
import AuthenticationSessionController from '../controllers/AuthenticationSessionController';


const sessionsRouter = Router();
const sessionsController = new AuthenticationSessionController();

// rota para criar uma sessão
sessionsRouter.post('/',
celebrate({
  [Segments.BODY]: {
    email: Joi.string().email().required(),
    password: Joi.string().required()
  },
}),
asyncHandler(sessionsController.create.bind(sessionsController)));


export default sessionsRouter;
