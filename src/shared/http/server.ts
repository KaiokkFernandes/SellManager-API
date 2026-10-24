import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './router';
import AppError from '../erros/AppError';
import '../typeorm';
import {errors} from "celebrate"
import upload from '@config/upload';
import { env } from '@config/env';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/files', express.static(upload.directory));
app.use(routes);
app.use(errors());


// Middleware para tratamento de erros
app.use((error: AppError | Error, _request: Request, response: Response, _next: NextFunction): void => {
  console.error('Erro capturado pelo middleware:', error); // Log adicional para depuração
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  } else {
    response.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});


app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}! 🚀`);
});
